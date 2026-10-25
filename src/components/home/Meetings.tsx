import Image from "next/image";
import { VideoEmbed } from "@/components/VideoEmbed";
import { meetings } from "@/config/content";
import { media } from "@/config/site";
import { SectionHeading } from "./SectionHeading";

const gallery = [
  { src: "/images/group-action.jpg", alt: "Membri G33 așezați în cerc, discutând la o întâlnire fizică", w: 1600, h: 1067 },
  { src: "/images/conversation.jpg", alt: "Doi membri G33 în conversație la o întâlnire", w: 1400, h: 933 },
  { src: "/images/members.jpg", alt: "Trei membri G33 la o întâlnire", w: 1400, h: 933 },
];

export function Meetings() {
  const hasVideo = Boolean(media.meetingYoutubeUrl) || process.env.NODE_ENV !== "production";
  return (
    <section id="meetinguri" aria-labelledby="meetinguri-title" className="relative border-y border-line bg-ink-2 py-24 md:py-32">
      <div className="container-g">
        <SectionHeading id="meetinguri-title" eyebrow={meetings.eyebrow} title={meetings.title} intro={meetings.intro} />

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {meetings.items.map((m) => (
            <article key={m.title} className="card card-hover flex flex-col p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-volt">{m.kicker}</p>
              <h3 className="mt-5 font-display text-2xl font-bold tracking-tight">{m.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{m.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-12">
          <figure className="relative overflow-hidden rounded-3xl border border-line md:col-span-7 md:row-span-2">
            <Image
              src={gallery[0].src}
              alt={gallery[0].alt}
              width={gallery[0].w}
              height={gallery[0].h}
              sizes="(min-width: 768px) 58vw, 100vw"
              className="h-full w-full object-cover"
            />
          </figure>
          {gallery.slice(1).map((g) => (
            <figure key={g.src} className="relative overflow-hidden rounded-3xl border border-line md:col-span-5">
              <Image src={g.src} alt={g.alt} width={g.w} height={g.h} sizes="(min-width: 768px) 42vw, 100vw" className="h-full w-full object-cover" />
            </figure>
          ))}
        </div>

        {hasVideo && (
          <div className="mt-16 grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h3 className="font-display text-2xl font-bold tracking-tight">Din interiorul unei întâlniri</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">Un scurt film de la una dintre întâlnirile fizice ale comunității.</p>
            </div>
            <div className="lg:col-span-8">
              <VideoEmbed
                url={media.meetingYoutubeUrl}
                poster="/images/meeting.jpg"
                title="Întâlnire fizică G33"
                devLabel="Video YouTube neconfigurat — setează NEXT_PUBLIC_MEETING_YOUTUBE_URL"
                stillWhenMissing={false}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
