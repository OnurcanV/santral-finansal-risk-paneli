// ==================================================================
// DOSYA 1: frontend/src/services/authApiService.ts - GÜNCELLEME
// ==================================================================
// Bu dosyaya, giriş yapma isteğini gönderecek olan yeni fonksiyonu ekliyoruz.

// RegisterInput tipini LoginInput olarak da kullanabiliriz, ama netlik için ayıralım.
type LoginInput = {
    email: string;
    password: string;
};
type RegisterInput = LoginInput;

const API_URL = 'http://localhost:8080/api/auth';

export const registerUser = async (userData: RegisterInput) => {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Bir hata oluştu.');
        }
        return data;
    } catch (error) {
        console.error("Kullanıcı kaydı sırasında hata:", error);
        throw error;
    }
};

// --- YENİ EKLENEN FONKSİYON ---
// Kullanıcı girişi için backend'e istek gönderen fonksiyon.
export const loginUser = async (userData: LoginInput) => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();
        if (!response.ok) {
            // Backend'den gelen "Geçersiz e-posta veya şifre" mesajını yakalıyoruz.
            throw new Error(data.message || 'Bir hata oluştu.');
        }
        return data; // Başarılı olursa, { token: "..." } objesini döndürür.
    } catch (error) {
        console.error("Kullanıcı girişi sırasında hata:", error);
        throw error;
    }
};