const photoSlots = [
  { src: '/about-scrapbook/football-team.webp', width: 1206, height: 846, alt: 'Football team group photo on the field', className: 'about-scrapbook__note--one' },
  { src: '/about-scrapbook/japan-garden.webp', width: 1206, height: 1564, alt: 'Portrait in a snowy Japanese garden', className: 'about-scrapbook__note--two' },
  { src: '/about-scrapbook/evening-with-friends.webp', width: 1206, height: 1361, alt: 'Group portrait with friends at night', className: 'about-scrapbook__note--three' },
  { src: '/about-scrapbook/fish-eye.webp', width: 1206, height: 1399, alt: 'Fisheye photo of me and a friend indoors', className: 'about-scrapbook__note--four' },
]

export default function AboutScrapbook() {
  return (
    <section className="about-scrapbook" aria-label="Personal photo scrapbook">
      {photoSlots.map((photo) => (
        <article className={`about-scrapbook__note ${photo.className}`} key={photo.src}>
          <figure className="about-scrapbook__photo">
            <img
              src={photo.src}
              srcSet={`${photo.src.replace('.webp', '-640.webp')} 640w, ${photo.src} 1206w`}
              sizes="(max-width: 900px) 28vw, 300px"
              width={photo.width}
              height={photo.height}
              alt={photo.alt}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </figure>
        </article>
      ))}
    </section>
  )
}
