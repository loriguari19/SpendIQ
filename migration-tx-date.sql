-- Migration: data della transazione (tx_date)
-- Eseguire nell'SQL Editor di Supabase (come per lo schema iniziale).
-- 1) aggiunge la colonna data alle spese
-- 2) riempie le spese già esistenti usando la data di inserimento

alter table expenses add column if not exists tx_date date;
update expenses set tx_date = created_at::date where tx_date is null;
