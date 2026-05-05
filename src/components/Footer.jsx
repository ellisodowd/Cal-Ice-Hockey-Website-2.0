export default function Footer({ className = 'bottom homeBottom' }) {
  return (
    <section className={className}>
      <section className="socialmediacontainer">
        <div className="FollowUs">Follow Us:</div>
        <div>
          <a href="https://www.instagram.com/calicehockey/?utm_source=ig_web_button_share_sheet&igshid=OGQ5ZDc2ODk2ZA==" target="_blank" rel="noreferrer">
            <img src="/images/new-instagram-logo-white-border-icon-png-large.png" alt="Instagram" />
          </a>
        </div>
        <div>
          <a href="https://www.tiktok.com/@californiaicehockey" target="_blank" rel="noreferrer">
            <img src="/images/tiktok-round-white-icon.webp" alt="TikTok" />
          </a>
        </div>
        <div>
          <a href="https://x.com/Cal_IceHockey" target="_blank" rel="noreferrer">
            <img src="/images/x-social-media-white-round-icon.png" alt="X" />
          </a>
        </div>
      </section>
    </section>
  )
}
