import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, setAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import api from '../services/api';
import Toast from '../components/Toast';
import '../styles/template-style.css';

import {
    FaArrowLeft, FaCamera, FaTrashAlt,
    FaEye, FaEyeSlash, FaLock, FaShieldAlt
} from 'react-icons/fa';

function AdminProfile() {
    const navigate = useNavigate();
    const { user, token } = getAuth();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [profile, setProfile] = useState(null);
    const [passwordData, setPasswordData] = useState({
        current_password: '', new_password: '', confirm_password: ''
    });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/admin/login');
            return;
        }
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/profile');
            const data = response.data;
            setProfile(data);
            if (data.avatar) setAvatarPreview(getImageUrl(data.avatar));
        } catch (error) {
            console.error('Errore caricamento profilo:', error);
            showToast('Errore nel caricamento del profilo', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => setToast({ message, type });

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast('Immagine troppo grande (max 5MB)', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result);
        reader.readAsDataURL(file);

        try {
            setUploadingAvatar(true);
            const submitData = new FormData();
            submitData.append('nome', profile?.nome || '');
            submitData.append('cognome', profile?.cognome || '');
            submitData.append('avatar', file);

            const response = await api.put('/admin/profile', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const updatedUser = { ...user, avatar: response.data.avatar, full_name: response.data.full_name };
            setAuth(token, updatedUser);
            window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
            setProfile(prev => ({ ...prev, avatar: response.data.avatar }));
            showToast('Foto profilo aggiornata', 'success');
        } catch (error) {
            showToast('Errore nel caricamento dell\'immagine', 'error');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleRemoveAvatar = async () => {
        try {
            setUploadingAvatar(true);
            const response = await api.put('/admin/profile', {
                nome: profile?.nome || '', cognome: profile?.cognome || '', remove_avatar: true
            });
            const updatedUser = { ...user, avatar: null, full_name: response.data.full_name };
            setAuth(token, updatedUser);
            window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
            setAvatarPreview(null);
            setProfile(prev => ({ ...prev, avatar: null }));
            showToast('Foto profilo rimossa', 'success');
        } catch (error) {
            showToast('Errore nella rimozione', 'error');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
            showToast('Compila tutti i campi', 'error');
            return;
        }
        if (passwordData.new_password.length < 8) {
            showToast('La password deve essere di almeno 8 caratteri', 'error');
            return;
        }
        if (passwordData.new_password !== passwordData.confirm_password) {
            showToast('Le password non coincidono', 'error');
            return;
        }
        try {
            setSaving(true);
            await api.put('/admin/profile/password', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            showToast('Password aggiornata con successo', 'success');
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        } catch (error) {
            showToast(error.response?.data?.error || 'Password attuale non corretta', 'error');
        } finally {
            setSaving(false);
        }
    };

    const togglePasswordVisibility = (field) => setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));

    const getInitials = () => {
        if (!profile) return 'A';
        return `${profile.nome?.[0] || ''}${profile.cognome?.[0] || ''}`.toUpperCase() || 'A';
    };

    if (loading) {
        return (
            <div style={styles.page}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <button style={styles.backButton} onClick={() => navigate('/admin/dashboard')}>
                    <FaArrowLeft />
                    <span>Dashboard</span>
                </button>
                <h1 style={styles.pageTitle}>Il mio profilo</h1>
            </div>

            {/* Main Content */}
            <div style={styles.content}>
                {/* Profile Card */}
                <div style={styles.card}>
                    <div style={styles.profileSection}>
                        <div style={styles.avatarContainer}>
                            <div
                                style={{
                                    ...styles.avatar,
                                    opacity: uploadingAvatar ? 0.6 : 1
                                }}
                                onClick={handleAvatarClick}
                            >
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt={profile?.full_name} style={styles.avatarImg} />
                                ) : (
                                    <span style={styles.avatarInitials}>{getInitials()}</span>
                                )}
                            </div>
                            <div style={styles.avatarButtons}>
                                <button
                                    style={styles.avatarBtn}
                                    onClick={handleAvatarClick}
                                    disabled={uploadingAvatar}
                                    title="Cambia foto"
                                >
                                    <FaCamera />
                                </button>
                                {avatarPreview && (
                                    <button
                                        style={{...styles.avatarBtn, ...styles.avatarBtnDelete}}
                                        onClick={handleRemoveAvatar}
                                        disabled={uploadingAvatar}
                                        title="Rimuovi foto"
                                    >
                                        <FaTrashAlt />
                                    </button>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <h2 style={styles.profileName}>{profile?.full_name || 'Admin'}</h2>
                        <span style={styles.profileRole}>
                            <FaShieldAlt style={{ marginRight: '6px' }} />
                            Amministratore
                        </span>
                        <p style={styles.profileEmail}>{profile?.email}</p>
                    </div>
                </div>

                {/* Password Card */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <FaLock style={styles.cardIcon} />
                        <div>
                            <h3 style={styles.cardTitle}>Modifica Password</h3>
                            <p style={styles.cardSubtitle}>Aggiorna la password del tuo account</p>
                        </div>
                    </div>

                    <form onSubmit={handleChangePassword} style={styles.form}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Password Attuale</label>
                            <div style={styles.inputWrapper}>
                                <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    name="current_password"
                                    value={passwordData.current_password}
                                    onChange={handlePasswordChange}
                                    placeholder="Inserisci la password attuale"
                                    style={styles.input}
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('current')}
                                    style={styles.eyeButton}
                                >
                                    {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Nuova Password</label>
                                <div style={styles.inputWrapper}>
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        name="new_password"
                                        value={passwordData.new_password}
                                        onChange={handlePasswordChange}
                                        placeholder="Nuova password"
                                        style={styles.input}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('new')}
                                        style={styles.eyeButton}
                                    >
                                        {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                <span style={styles.hint}>Minimo 8 caratteri</span>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Conferma Password</label>
                                <div style={styles.inputWrapper}>
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        name="confirm_password"
                                        value={passwordData.confirm_password}
                                        onChange={handlePasswordChange}
                                        placeholder="Conferma password"
                                        style={styles.input}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('confirm')}
                                        style={styles.eyeButton}
                                    >
                                        {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button type="submit" style={styles.submitButton} disabled={saving}>
                            {saving ? 'Aggiornamento...' : 'Aggiorna Password'}
                        </button>
                    </form>
                </div>
            </div>

            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}
        </div>
    );
}

const styles = {
    page: {
        minHeight: 'calc(100vh - 73px)',
        background: '#F5F5F7',
        padding: '32px',
    },
    header: {
        maxWidth: '600px',
        marginBottom: '24px',
    },
    backButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: 'none',
        border: 'none',
        color: '#6B7280',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        padding: '0',
        marginBottom: '12px',
        transition: 'color 0.2s',
    },
    pageTitle: {
        fontSize: '24px',
        fontWeight: 700,
        color: '#1A1A1A',
        margin: 0,
    },
    content: {
        maxWidth: '600px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    card: {
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
    profileSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: '16px',
    },
    avatar: {
        width: '88px',
        height: '88px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #1A1A1A 0%, #333 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'transform 0.2s, opacity 0.2s',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    avatarInitials: {
        color: '#85FF00',
        fontSize: '28px',
        fontWeight: 700,
    },
    avatarButtons: {
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        marginTop: '10px',
    },
    avatarBtn: {
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        border: 'none',
        background: '#1A1A1A',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '12px',
        transition: 'background 0.2s',
    },
    avatarBtnDelete: {
        background: '#FEE2E2',
        color: '#DC2626',
    },
    profileName: {
        fontSize: '20px',
        fontWeight: 700,
        color: '#1A1A1A',
        margin: '0 0 6px 0',
    },
    profileRole: {
        display: 'inline-flex',
        alignItems: 'center',
        background: '#F0FDF4',
        color: '#166534',
        fontSize: '12px',
        fontWeight: 600,
        padding: '4px 10px',
        borderRadius: '20px',
        marginBottom: '6px',
    },
    profileEmail: {
        color: '#6B7280',
        fontSize: '13px',
        margin: 0,
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #F3F4F6',
    },
    cardIcon: {
        fontSize: '16px',
        color: '#85FF00',
        background: '#1A1A1A',
        padding: '10px',
        borderRadius: '10px',
        flexShrink: 0,
    },
    cardTitle: {
        fontSize: '16px',
        fontWeight: 600,
        color: '#1A1A1A',
        margin: '0 0 2px 0',
    },
    cardSubtitle: {
        fontSize: '13px',
        color: '#6B7280',
        margin: 0,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    formRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    label: {
        fontSize: '13px',
        fontWeight: 600,
        color: '#374151',
    },
    inputWrapper: {
        position: 'relative',
    },
    input: {
        width: '100%',
        padding: '10px 40px 10px 14px',
        fontSize: '14px',
        border: '1.5px solid #E5E7EB',
        borderRadius: '8px',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box',
    },
    eyeButton: {
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        color: '#9CA3AF',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hint: {
        fontSize: '11px',
        color: '#9CA3AF',
    },
    submitButton: {
        background: '#85FF00',
        color: '#1A1A1A',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        alignSelf: 'flex-start',
        transition: 'background 0.2s, transform 0.2s',
    },
};

export default AdminProfile;
