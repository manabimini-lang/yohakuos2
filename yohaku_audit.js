const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
(async () => {
  try {
    console.log('ENV CHECK:');
    console.log('DATABASE_URL=', !!process.env.DATABASE_URL);
    console.log('GOOGLE_CLIENT_ID=', !!process.env.GOOGLE_CLIENT_ID);
    console.log('GOOGLE_CLIENT_SECRET=', !!process.env.GOOGLE_CLIENT_SECRET);
    console.log('NEXTAUTH_URL=', !!process.env.NEXTAUTH_URL);
    console.log('NEXTAUTH_SECRET=', !!(process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET));
    console.log('SUPABASE_URL=', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY=', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log('SUPABASE_SERVICE_ROLE_KEY=', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const prisma = new PrismaClient();
    await prisma.$connect();
    const dbUrl = process.env.DATABASE_URL;
    const url = new URL(dbUrl);
    console.log('PRISMA DATABASE HOST=', url.hostname);
    console.log('PRISMA DATABASE PORT=', url.port || '5432');

    const [userCount, sessionCount, accountCount, aiSettingsCount, contentCount, siteSettingsCount] = await Promise.all([
      prisma.user.count(),
      prisma.session.count(),
      prisma.account.count(),
      prisma.userAISettings.count(),
      prisma.content.count(),
      prisma.siteSettings.count(),
    ]);
    console.log('COUNTS:', { userCount, sessionCount, accountCount, aiSettingsCount, contentCount, siteSettingsCount });

    const latestUser = await prisma.user.findFirst({ orderBy: { createdAt: 'desc' }, select: { id: true, email: true, name: true, role: true, plan: true, createdAt: true, updatedAt: true } });
    const latestGoogleAccount = await prisma.account.findFirst({ where: { provider: 'google' }, orderBy: { id: 'desc' }, select: { id: true, userId: true, provider: true, providerAccountId: true, expires_at: true } });
    const latestSession = await prisma.session.findFirst({ orderBy: { expires: 'desc' }, select: { id: true, userId: true, expires: true } });
    const latestAiSettings = await prisma.userAISettings.findFirst({ orderBy: { updatedAt: 'desc' }, select: { id: true, userId: true, provider: true, model: true, isEnabled: true, createdAt: true, updatedAt: true } });
    const latestContent = await prisma.content.findFirst({ orderBy: { createdAt: 'desc' }, select: { id: true, title: true, slug: true, createdBy: true, createdAt: true, publishStatus: true, visibility: true } });
    const siteSettings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    console.log('LATEST USER:', latestUser);
    console.log('LATEST GOOGLE ACCOUNT:', latestGoogleAccount);
    console.log('LATEST SESSION:', latestSession);
    console.log('LATEST AI SETTINGS:', latestAiSettings);
    console.log('LATEST CONTENT:', latestContent);
    console.log('SITE SETTINGS:', siteSettings);

    const prismaVersion = require('@prisma/client/package.json').version;
    console.log('PRISMA CLIENT VERSION=', prismaVersion);

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    try {
      const { data: ssData, error: ssError } = await supabase.from('site_settings').select('*').limit(1);
      if (ssError) {
        console.log('SUPABASE QUERY SITE_SETTINGS ERROR=', ssError.message || ssError);
      } else {
        console.log('SUPABASE site_settings rows=', ssData?.length, ssData && ssData[0]);
      }
    } catch (e) {
      console.log('SUPABASE QUERY FAILED', e);
    }

    const auditSlug = `audit-test-${Date.now()}`;
    let testUser = latestUser;
    if (!testUser) {
      const createdUser = await prisma.user.create({ data: { email: `audit-test-${Date.now()}@example.com`, name: 'Audit Test', role: 'FREE_MEMBER', plan: 'free' } });
      testUser = createdUser;
      console.log('CREATED AUDIT USER', { id: testUser.id, email: testUser.email });
    }
    const createdContent = await prisma.content.create({ data: {
      title: 'Audit Test Content',
      slug: auditSlug,
      description: 'Audit test content object',
      content: 'Audit content body',
      contentType: 'ARTICLE',
      visibility: 'PUBLIC',
      layer: 'BEGINNER',
      createdBy: testUser.id,
    }});
    console.log('CREATED TEST CONTENT', { id: createdContent.id, slug: createdContent.slug });
    const contentCountAfter = await prisma.content.count();
    console.log('CONTENT COUNT AFTER CREATE=', contentCountAfter);
    const foundTestContent = await prisma.content.findUnique({ where: { slug: auditSlug }, select: { id: true, title: true, createdBy: true, createdAt: true } });
    console.log('FOUND TEST CONTENT=', foundTestContent);
    await prisma.content.delete({ where: { id: createdContent.id } });
    console.log('DELETED TEST CONTENT');

    const siteSettingsBeforeTitle = siteSettings?.siteTitle;
    const updatedSiteSettings = await prisma.siteSettings.upsert({
      where: { id: 'global' },
      update: { siteTitle: 'YOHAKU AUDIT TEST' },
      create: { id: 'global', siteTitle: 'YOHAKU AUDIT TEST', siteDescription: 'Audit test', primaryColor: '#000000', cardStyle: 'DEFAULT' },
    });
    console.log('UPDATED SITE SETTINGS TITLE TO', updatedSiteSettings.siteTitle);
    if (siteSettings) {
      await prisma.siteSettings.update({ where: { id: 'global' }, data: { siteTitle: siteSettingsBeforeTitle } });
      console.log('RESTORED SITE SETTINGS TITLE TO', siteSettingsBeforeTitle);
    }

    const aiSettingsUpsert = await prisma.userAISettings.upsert({
      where: { userId: testUser.id },
      create: {
        userId: testUser.id,
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        isEnabled: false,
      },
      update: {
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        isEnabled: false,
      },
    });
    console.log('AI SETTINGS UPSERT RESULT', { id: aiSettingsUpsert.id, userId: aiSettingsUpsert.userId, model: aiSettingsUpsert.model, updatedAt: aiSettingsUpsert.updatedAt });

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error);
    process.exit(1);
  }
})();
