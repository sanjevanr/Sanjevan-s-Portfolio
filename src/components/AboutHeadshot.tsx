import PhotoPanel from './PhotoPanel'

export default function AboutHeadshot() {
  return (
    <div className="about-headshot-wrap">
      <PhotoPanel
        src="/about-headshot.jpg"
        alt="Portrait of Sanjevan Rajasegar"
        className="photo-frame--about-headshot"
      />
    </div>
  )
}
