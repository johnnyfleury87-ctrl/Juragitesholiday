'use client';

// Social media configuration with brand colors
const SOCIAL_CONFIG = {
  facebook: {
    name: 'Facebook',
    href: 'https://facebook.com/',
    color: '#1877F2',
    label: 'Visit us on Facebook'
  },
  instagram: {
    name: 'Instagram',
    href: 'https://instagram.com/',
    color: 'linear-gradient(135deg, #FD1D1D 0%, #833AB4 100%)',
    label: 'Follow us on Instagram'
  },
  airbnb: {
    name: 'Airbnb',
    href: 'https://airbnb.com/',
    color: '#FF5A5F',
    label: 'View our Airbnb listings'
  }
};

export function SocialLinks() {
  const socialLinks = [SOCIAL_CONFIG.facebook, SOCIAL_CONFIG.instagram, SOCIAL_CONFIG.airbnb];

  return (
    <div className="social-links">
      {socialLinks.map((social) => (
        <a
          key={social.name}
          href={social.href}
          title={social.name}
          className="social-link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.label}
        >
          <svg
            className="social-icon"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="currentColor"
          >
            {social.name === 'Facebook' && (
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            )}
            {social.name === 'Instagram' && (
              <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.217.63c-.68.297-1.268.655-1.855 1.242-.586.586-.945 1.175-1.242 1.855-.297.688-.498 1.558-.557 2.836C.008 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.836.297.688.656 1.278 1.242 1.865.586.586 1.177.94 1.855 1.237.688.297 1.56.498 2.837.557C8.333 23.99 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.26 2.836-.557.688-.297 1.268-.656 1.855-1.242.586-.587.94-1.178 1.237-1.856.297-.688.498-1.559.557-2.836.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.26-2.148-.557-2.837-.297-.687-.656-1.267-1.242-1.853-.586-.586-1.178-.94-1.856-1.237-.688-.297-1.559-.498-2.836-.557C15.667.008 15.26 0 12 0zm0 2.16c3.203 0 3.585.009 4.849.07 1.171.054 1.805.244 2.227.408.56.217.96.477 1.382.896.419.42.679.822.896 1.381.164.422.354 1.057.408 2.227.061 1.264.07 1.645.07 4.849 0 3.203-.009 3.585-.07 4.849-.054 1.171-.244 1.805-.408 2.227-.217.56-.477.96-.896 1.382-.42.419-.822.679-1.381.896-.422.164-1.057.354-2.227.408-1.264.061-1.645.07-4.849.07-3.203 0-3.585-.009-4.849-.07-1.171-.054-1.805-.244-2.227-.408-.56-.217-.96-.477-1.382-.896-.419-.42-.679-.822-.896-1.381-.164-.422-.354-1.057-.408-2.227-.061-1.264-.07-1.645-.07-4.849 0-3.203.009-3.585.07-4.849.054-1.171.244-1.805.408-2.227.217-.56.477-.96.896-1.382.42-.419.822-.679 1.381-.896.422-.164 1.057-.354 2.227-.408 1.264-.061 1.645-.07 4.849-.07zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z" />
            )}
            {social.name === 'Airbnb' && (
              <path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zm0 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm0 2.5c2.07 0 3.75 1.68 3.75 3.75s-1.68 3.75-3.75 3.75-3.75-1.68-3.75-3.75 1.68-3.75 3.75-3.75zm0 7.5c2.49 0 4.5 2.01 4.5 4.5 0 1.24-.5 2.36-1.3 3.2-.3.3-.8.5-1.2.5-.4 0-.9-.2-1.2-.5-.5-.5-.8-1.2-.8-2v-2c0-.55.45-1 1-1s1 .45 1 1v1.5c.2-.1.4-.2.6-.2s.4.1.6.2v-1.5c0-.55.45-1 1-1s1 .45 1 1v2c0 .8-.3 1.5-.8 2-.3.3-.8.5-1.2.5-.4 0-.9-.2-1.2-.5-.8-.84-1.3-1.96-1.3-3.2 0-2.49 2.01-4.5 4.5-4.5z" />
            )}
          </svg>
        </a>
      ))}
    </div>
  );
}

export function SocialLinksFooter() {
  const socialLinks = [
    {
      name: 'Facebook',
      href: 'https://facebook.com/',
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com/',
    },
    {
      name: 'Airbnb',
      href: 'https://airbnb.com/',
    },
  ];

  return (
    <div className="social-links-footer">
      <span className="social-footer-label">Nous suivre</span>
      {socialLinks.map((social) => (
        <a
          key={social.name}
          href={social.href}
          title={social.name}
          className="social-link-footer"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit our ${social.name}`}
        >
          {social.name}
        </a>
      ))}
    </div>
  );
}
