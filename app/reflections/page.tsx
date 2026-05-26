import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { QuietAudioPlayer } from "@/components/audio/QuietAudioPlayer";

export const dynamic = "force-dynamic";

export default async function ReflectionsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const isPremium = session.user.role === "PAID_MEMBER" || session.user.role === "ADMIN";

  const audioReflections = await prisma.audioReflection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: isPremium ? 50 : 10,
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white/80 pb-32 selection:bg-white/10">
      <main className="max-w-2xl mx-auto px-6 pt-32 space-y-32">
        
        {/* Header section */}
        <section className="space-y-6">
          <h1 className="text-2xl md:text-3xl font-light tracking-widest text-white/90">
            夜の机
          </h1>
          <p className="text-sm md:text-base text-white/40 leading-relaxed font-light">
            言葉にならないものが、静かに語り返してくる空間。
          </p>
        </section>

        {/* Audio Reflections List */}
        <section className="space-y-16">
          {audioReflections.length === 0 && (
            <p className="text-sm text-white/30 italic font-light">
              まだ、振り返る言葉がありません。
            </p>
          )}

          {audioReflections.map((audio, index) => (
            <div 
              key={audio.id} 
              className="group space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex items-center gap-4 text-xs font-mono text-white/20">
                <span className="w-8 h-[1px] bg-white/10" />
                {new Date(audio.createdAt).toLocaleDateString()}
              </div>
              
              <div className="pl-12 space-y-8">
                <p className="text-sm md:text-base leading-loose font-light text-white/60 whitespace-pre-wrap">
                  {audio.script}
                </p>

                {audio.status === "completed" && audio.audioUrl && (
                  <div className="pt-4">
                    <QuietAudioPlayer src={audio.audioUrl} title="静かな振り返り" />
                  </div>
                )}
                {audio.status === "pending" && (
                  <p className="text-xs text-white/30 italic">
                    (音声を生成しています...)
                  </p>
                )}
              </div>
            </div>
          ))}
        </section>

        {!isPremium && audioReflections.length >= 10 && (
          <div className="pt-16 border-t border-white/5 text-center">
            <p className="text-xs text-white/30 font-light">
              これより古い記憶は霧の中に沈んでいます。
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
