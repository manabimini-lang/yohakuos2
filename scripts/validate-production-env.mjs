const required = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "CRON_SECRET",
];

const placeholderPattern = /(^|[-_])(your|replace|change[-_]?me|example)([-_]|$)|\.\.\.$/i;
const errors = [];

for (const name of required) {
  const value = process.env[name]?.trim();
  if (!value) {
    errors.push(`${name} is missing`);
  } else if (placeholderPattern.test(value)) {
    errors.push(`${name} still contains a placeholder value`);
  }
}

for (const name of ["DATABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXTAUTH_URL"]) {
  const value = process.env[name]?.trim();
  if (!value) continue;
  try {
    const url = new URL(value);
    if (name === "DATABASE_URL" && !["postgres:", "postgresql:"].includes(url.protocol)) {
      errors.push(`${name} must use postgres:// or postgresql://`);
    }
    if (name !== "DATABASE_URL" && url.protocol !== "https:") {
      errors.push(`${name} must use https:// in production`);
    }
  } catch {
    errors.push(`${name} is not a valid URL`);
  }
}

for (const name of ["NEXTAUTH_SECRET", "CRON_SECRET"]) {
  const value = process.env[name]?.trim();
  if (value && value.length < 32) errors.push(`${name} must be at least 32 characters`);
}

const googleValues = [process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET];
if (googleValues.some(Boolean) && !googleValues.every(Boolean)) {
  errors.push("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured together");
}

if (errors.length > 0) {
  console.error("Production environment validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Production environment validation passed (${required.length} required values).`);
