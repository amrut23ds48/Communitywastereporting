import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mnkyaakbizxydtgulugu.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ua3lhYWtiaXp4eWR0Z3VsdWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NDAyOTgsImV4cCI6MjA4MjIxNjI5OH0.J34bILRG1GqoftsqINfI2xSpy4A1TsEYjKedymFmDm0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
