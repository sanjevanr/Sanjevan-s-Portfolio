import PhotoPanel from './PhotoPanel'

export default function AboutHeadshot() {
  return (
    <div className="about-headshot-wrap">
      <PhotoPanel
        src="/about-headshot.webp"
        srcSet="/about-headshot-640.webp 640w, /about-headshot.webp 671w"
        sizes="(max-width: 760px) 68vw, 240px"
        width={671}
        height={671}
        alt="Portrait of Sanjevan Rajasegar"
        className="photo-frame--about-headshot"
      />
    </div>
  )
}
