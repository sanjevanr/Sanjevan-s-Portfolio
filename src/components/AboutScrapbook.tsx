const photoSlots = [
  { src: '/about-scrapbook/football-team.jpg', alt: 'Football team group photo on the field', className: 'about-scrapbook__note--one' },
  { src: '/about-scrapbook/japan-garden.jpg', alt: 'Portrait in a snowy Japanese garden', className: 'about-scrapbook__note--two' },
  { src: '/about-scrapbook/evening-with-friends.jpg', alt: 'Group portrait with friends at night', className: 'about-scrapbook__note--three' },
  { src: '/about-scrapbook/snow-day.jpg', alt: 'Portrait in falling snow', className: 'about-scrapbook__note--four' },
]

export default function AboutScrapbook() {
  return (
    <section className="about-scrapbook" aria-label="Personal photo scrapbook">
      {photoSlots.map((photo) => (
        <article className={`about-scrapbook__note ${photo.className}`} key={photo.src}>
          <figure className="about-scrapbook__photo">
            <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" draggable={false} />
          </figure>
        </article>
      ))}
    </section>
  )
}
