import fs from 'node:fs'
import path from 'node:path'

const OLD_URL = 'https://mbcexthhbscthqiewcsd.supabase.co'
const OLD_KEY = 'sb_publishable_aVqLwBj4ai5P_ANn-hbrXw_V4Zv1BTz'

const NEW_URL = 'https://hdtitictjvvhzihlavjp.supabase.co'

function readDevVars() {
  const file = path.resolve('.dev.vars')

  if (!fs.existsSync(file)) {
    throw new Error('.dev.vars not found')
  }

  const content = fs.readFileSync(file, 'utf8')
  const env = {}

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) continue

    const index = trimmed.indexOf('=')
    if (index === -1) continue

    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    env[key] = value
  }

  return env
}

const devVars = readDevVars()
const NEW_KEY = 'sb_publishable_DRmT7sA3ntsqM3XuD_5hEg_vwyEKP51'

if (!OLD_KEY) {
  throw new Error('Missing OLD_SUPABASE_PUBLISHABLE_KEY environment variable.')
}

if (!NEW_KEY) {
  throw new Error('SUPABASE_SECRET_KEY is missing from .dev.vars.')
}

async function oldFetch(table) {
  const response = await fetch(`${OLD_URL}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: OLD_KEY,
      Authorization: `Bearer ${OLD_KEY}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Old Supabase ${table} failed: ${response.status}\n${text}`)
  }

  return response.json()
}

async function newInsert(table, rows) {
  if (!rows.length) {
    console.log(`  ${table}: 0 rows`)
    return
  }

  const response = await fetch(`${NEW_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
  apikey: NEW_KEY,
  Authorization: `Bearer ${NEW_KEY}`,
  'Content-Type': 'application/json',
  'X-Client-Info': 'munafaestate-migration',
  Prefer: 'return=minimal',
},
    body: JSON.stringify(rows),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`New Supabase ${table} failed: ${response.status}\n${text}`)
  }

  console.log(`  ${table}: ${rows.length} rows inserted`)
}

async function migrateTable(table, transform = (row) => row) {
  console.log(`\nFetching ${table}...`)

  const rows = await oldFetch(table)
  const transformed = rows.map(transform)

  await newInsert(table, transformed)

  return transformed
}

async function main() {
  console.log('======================================')
  console.log(' MunafaEstate Supabase Migration')
  console.log('======================================')

  console.log('\nReading old article export...')

  const articleFile = path.resolve('old-articles.json')

  if (!fs.existsSync(articleFile)) {
    throw new Error(`old-articles.json not found at ${articleFile}`)
  }

  const rawArticles = fs
    .readFileSync(articleFile, 'utf8')
    .replace(/^\uFEFF/, '')
    .trim()

  let exportedArticles

  try {
    exportedArticles = JSON.parse(rawArticles)
  } catch (error) {
    console.error('\n❌ old-articles.json is not valid JSON.')
    console.error('\nFirst 500 characters of the file:')
    console.error(rawArticles.slice(0, 500))
    throw error
  }

 if (Array.isArray(exportedArticles)) {
   // Already an array
 } else if (Array.isArray(exportedArticles.value)) {
   // PowerShell wrapped the result in { value: [...] }
   exportedArticles = exportedArticles.value
 } else {
   throw new Error(
     `Could not find article array in old-articles.json. Top-level keys: ${Object.keys(
       exportedArticles,
     ).join(', ')}`,
   )
 }

  console.log(`Found ${exportedArticles.length} exported articles`)

  // ------------------------------------------------------------
  // 1. Parent/reference tables
  // ------------------------------------------------------------

  await migrateTable('categories')
  await migrateTable('authors')
  await migrateTable('tags')
  await migrateTable('areas')

  // ------------------------------------------------------------
  // 2. Articles
  // ------------------------------------------------------------

  await newInsert('articles', exportedArticles)

  // ------------------------------------------------------------
  // 3. Relationships
  // ------------------------------------------------------------

  await migrateTable('article_tags')
  await migrateTable('article_areas')

  // ------------------------------------------------------------
  // 4. Media
  // ------------------------------------------------------------

  const media = await oldFetch('media')

  // uploaded_by belongs to old Supabase auth users.
  // We don't want broken references in the new project.
  const cleanedMedia = media.map((row) => ({
    ...row,
    uploaded_by: null,
  }))

  await newInsert('media', cleanedMedia)

  console.log('\n======================================')
  console.log(' Migration completed successfully')
  console.log('======================================')
}

main().catch((error) => {
  console.error('\n❌ Migration failed')
  console.error(error)
  process.exit(1)
})
