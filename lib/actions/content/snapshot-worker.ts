import { prisma } from "@/lib/prisma";
import chromium from "@sparticuz/chromium";
import { chromium as playwright } from "playwright-core";
import { getSnapshotStorage } from "@/lib/snapshot-storage";

/**
 * YOHAKU Snapshot Worker
 * 保存されたURLのスクリーンショットを生成し、記憶の景色を固定します。
 */
export async function runSnapshotWorker() {
  // 1. status=pending のジョブ取得
  const job = await prisma.captureJob.findFirst({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
  });

  if (!job) return;

  // ジョブを処理中に更新
  const claimed = await prisma.captureJob.updateMany({
    where: { id: job.id, status: "pending" },
    data: { status: "processing" },
  });

  if (claimed.count === 0) return;

  // 2. Playwright起動
  const browser = await playwright.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // 3. URLへアクセス
    await page.goto(job.url, { waitUntil: "networkidle", timeout: 30000 });

    // 4. 3秒待機（レンダリングの沈殿を待つ）
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 5. スクリーンショット取得
    const screenshotBuffer = await page.screenshot({ type: "jpeg", quality: 80 });

    // 6. Storage保存
    const storage = getSnapshotStorage();
    const snapshotUrl = await storage.save(job.id, screenshotBuffer);

    // 7. Job更新 & ContentItemへ反映
    await prisma.captureJob.update({
      where: { id: job.id },
      data: {
        snapshotUrl,
        status: "completed",
      },
    });

    await prisma.contentItem.update({
      where: { id: job.contentItemId },
      data: {
        snapshotUrl,
      },
    });

  } catch (error) {
    console.error(`Snapshot failed for job ${job.id}:`, error);
    await prisma.captureJob.update({
      where: { id: job.id },
      data: { status: "failed" },
    });
  } finally {
    await browser.close();
  }
}
