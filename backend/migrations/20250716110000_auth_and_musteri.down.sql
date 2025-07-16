-- 20250716110000_auth_and_musteri.down.sql

DELETE FROM kullanicilar WHERE email = 'admin@example.com';

ALTER TABLE santraller DROP COLUMN IF EXISTS musteri_id;

DROP TABLE IF EXISTS kullanicilar;
DROP TABLE IF EXISTS musteriler;
