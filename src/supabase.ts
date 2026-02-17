import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://srepqywvzwnchvvxecdr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyZXBxeXd2enduY2h2dnhlY2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjE5NDcsImV4cCI6MjA4NTg5Nzk0N30.XXNtQhLhU5f1JIq9Qa5EFmQerWl-y0QLEZ7aWInpQ4U'

export const supabase = createClient(supabaseUrl, supabaseKey)
