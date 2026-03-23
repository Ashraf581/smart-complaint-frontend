// ============================================
// ComplaintForm.js
// Form to submit new complaints
// Calls POST /api/complaint
// ============================================

import React, { useState } from 'react';
import { submitComplaint } from '../services/api';
import './ComplaintForm.css';

function ComplaintForm() {
    // Form data state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: ''
    });

    // UI states
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    // ── NEW — photo states ──────────────────
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoGps, setPhotoGps] = useState(null);
    // ────────────────────────────────────────

    // Handle input changes
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // ── NEW — Extract GPS from photo EXIF ───
    const extractGpsFromExif = (arrayBuffer) => {
        try {
            const view = new DataView(arrayBuffer);

            if (view.getUint16(0, false) !== 0xFFD8) return null;

            let offset = 2;
            while (offset < view.byteLength - 2) {
                const marker = view.getUint16(offset, false);
                offset += 2;

                if (marker === 0xFFE1) {
                    const segmentLength = view.getUint16(offset, false);
                    offset += 2;

                    const exifHeader = String.fromCharCode(
                        view.getUint8(offset),
                        view.getUint8(offset + 1),
                        view.getUint8(offset + 2),
                        view.getUint8(offset + 3)
                    );

                    if (exifHeader !== 'Exif') return null;

                    const tiffStart = offset + 6;
                    const littleEndian =
                        view.getUint16(tiffStart, false) === 0x4949;
                    const ifdOffset =
                        view.getUint32(tiffStart + 4, littleEndian);
                    const ifdStart = tiffStart + ifdOffset;
                    const numEntries =
                        view.getUint16(ifdStart, littleEndian);

                    let gpsIfdOffset = null;
                    for (let i = 0; i < numEntries; i++) {
                        const entryOffset = ifdStart + 2 + i * 12;
                        const tag = view.getUint16(
                            entryOffset, littleEndian);
                        if (tag === 0x8825) {
                            gpsIfdOffset = view.getUint32(
                                entryOffset + 8, littleEndian);
                            break;
                        }
                    }

                    if (!gpsIfdOffset) return null;

                    const gpsStart = tiffStart + gpsIfdOffset;
                    const gpsEntries =
                        view.getUint16(gpsStart, littleEndian);

                    let latRef = null, lat = null;
                    let lngRef = null, lng = null;

                    for (let i = 0; i < gpsEntries; i++) {
                        const entryOffset = gpsStart + 2 + i * 12;
                        const tag = view.getUint16(
                            entryOffset, littleEndian);
                        const valueOffset = view.getUint32(
                            entryOffset + 8, littleEndian);
                        const absOffset = tiffStart + valueOffset;

                        if (tag === 1) {
                            latRef = String.fromCharCode(
                                view.getUint8(entryOffset + 8));
                        } else if (tag === 2) {
                            const d = view.getUint32(absOffset, littleEndian) /
                                view.getUint32(absOffset + 4, littleEndian);
                            const m = view.getUint32(absOffset + 8, littleEndian) /
                                view.getUint32(absOffset + 12, littleEndian);
                            const s = view.getUint32(absOffset + 16, littleEndian) /
                                view.getUint32(absOffset + 20, littleEndian);
                            lat = d + m / 60 + s / 3600;
                        } else if (tag === 3) {
                            lngRef = String.fromCharCode(
                                view.getUint8(entryOffset + 8));
                        } else if (tag === 4) {
                            const d = view.getUint32(absOffset, littleEndian) /
                                view.getUint32(absOffset + 4, littleEndian);
                            const m = view.getUint32(absOffset + 8, littleEndian) /
                                view.getUint32(absOffset + 12, littleEndian);
                            const s = view.getUint32(absOffset + 16, littleEndian) /
                                view.getUint32(absOffset + 20, littleEndian);
                            lng = d + m / 60 + s / 3600;
                        }
                    }

                    if (lat !== null && lng !== null) {
                        return {
                            lat: latRef === 'S' ? -lat : lat,
                            lng: lngRef === 'W' ? -lng : lng
                        };
                    }
                    return null;
                }

                if ((marker & 0xFF00) !== 0xFF00) break;
                if (offset + 2 > view.byteLength) break;
                offset += view.getUint16(offset, false);
            }
        } catch (e) {
            console.error('EXIF parse error:', e);
        }
        return null;
    };

    // ── NEW — Handle photo selection ────────
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError('Photo size must be less than 5MB!');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('Only image files are allowed!');
            return;
        }

        setError(null);

        // Read as ArrayBuffer for EXIF/GPS extraction
        const arrayReader = new FileReader();
        arrayReader.onload = (ev) => {
            const gps = extractGpsFromExif(ev.target.result);
            setPhotoGps(gps);
        };
        arrayReader.readAsArrayBuffer(file);

        // Read as Base64 for preview and saving
        const base64Reader = new FileReader();
        base64Reader.onload = (ev) => {
            setPhoto(ev.target.result);
            setPhotoPreview(ev.target.result);
        };
        base64Reader.readAsDataURL(file);
    };
    // ────────────────────────────────────────

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // ── NEW — photo is required ─────────
        if (!photo) {
            setError('Please upload a photo of the issue! Photo evidence is required.');
            return;
        }
        // ────────────────────────────────────

        setLoading(true);
        setSuccess(null);
        setError(null);

        try {
            // ── NEW — include photo and GPS ──
            const complaintData = {
                ...formData,
                photo: photo,
                photoLatitude: photoGps ? photoGps.lat : null,
                photoLongitude: photoGps ? photoGps.lng : null
            };
            // ────────────────────────────────

            const result = await submitComplaint(complaintData);
            setSuccess(result);

            // Clear form after success
            setFormData({
                title: '',
                description: '',
                location: ''
            });

            // ── NEW — clear photo too ────────
            setPhoto(null);
            setPhotoPreview(null);
            setPhotoGps(null);
            // ────────────────────────────────

        } catch (err) {
            setError('Failed to submit complaint. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <div className="form-card">
                <h2>📝 Submit a Complaint</h2>
                <p className="form-subtitle">
                    Your complaint will be automatically routed
                    to the right department using AI!
                </p>

                <form onSubmit={handleSubmit}>
                    {/* Title Field */}
                    <div className="form-group">
                        <label>Complaint Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. No water supply in our area"
                            required
                        />
                    </div>

                    {/* Description Field */}
                    <div className="form-group">
                        <label>Description *</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe your complaint in detail..."
                            rows="5"
                            required
                        />
                    </div>

                    {/* Location Field */}
                    <div className="form-group">
                        <label>Location *</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g. Hyderabad, Sector 4"
                            required
                        />
                    </div>

                    {/* ── NEW — Photo Upload ───────────────── */}
                    <div className="form-group">
                        <label>
                            Photo Evidence *
                            <span className="label-hint">
                                &nbsp;— take photo at the location
                            </span>
                        </label>

                        {!photoPreview ? (
                            <label className="photo-upload-area">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handlePhotoChange}
                                    style={{ display: 'none' }}
                                />
                                <div className="upload-placeholder">
                                    <span className="upload-icon">📸</span>
                                    <span className="upload-text">
                                        Click to take or upload photo
                                    </span>
                                    <span className="upload-hint">
                                        Max 5MB · JPG or PNG
                                    </span>
                                </div>
                            </label>
                        ) : (
                            <div className="photo-preview-container">
                                <img
                                    src={photoPreview}
                                    alt="Evidence"
                                    className="photo-preview"
                                />
                                <div className={`gps-badge ${photoGps ? 'gps-found' : 'gps-missing'}`}>
                                    {photoGps
                                        ? `📍 GPS found: ${photoGps.lat.toFixed(4)}, ${photoGps.lng.toFixed(4)}`
                                        : '⚠️ No GPS in photo. For best results, enable location on your camera.'}
                                </div>
                                <button
                                    type="button"
                                    className="remove-photo-btn"
                                    onClick={() => {
                                        setPhoto(null);
                                        setPhotoPreview(null);
                                        setPhotoGps(null);
                                    }}
                                >
                                    ✕ Remove & retake
                                </button>
                            </div>
                        )}
                    </div>
                    {/* ─────────────────────────────────────── */}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading || !photo}
                    >
                        {loading ? '🔄 Submitting...' : '🚀 Submit Complaint'}
                    </button>
                </form>

                {/* Success Message */}
                {success && (
                    <div className="success-card">
                        <h3>✅ Complaint Submitted Successfully!</h3>
                        <div className="result-grid">
                            <div className="result-item">
                                <span className="result-label">ID</span>
                                <span className="result-value">
                                    #{success.id}
                                </span>
                            </div>
                            <div className="result-item">
                                <span className="result-label">Department</span>
                                <span className={`badge dept-${success.department}`}>
                                    {success.department}
                                </span>
                            </div>
                            <div className="result-item">
                                <span className="result-label">Priority</span>
                                <span className={`badge priority-${success.priority}`}>
                                    {success.priority}
                                </span>
                            </div>
                            <div className="result-item">
                                <span className="result-label">AI Confidence</span>
                                <span className="result-value">
                                    {success.confidence}
                                </span>
                            </div>
                            {/* ── NEW — show verification ── */}
                            <div className="result-item">
                                <span className="result-label">Verification</span>
                                <span className={`badge verify-${success.verificationStatus}`}>
                                    {success.verificationStatus === 'VERIFIED'
                                        ? '✅ VERIFIED'
                                        : '⚠️ UNVERIFIED'}
                                </span>
                            </div>
                            {/* ─────────────────────────── */}
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="error-card">
                        ❌ {error}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ComplaintForm;