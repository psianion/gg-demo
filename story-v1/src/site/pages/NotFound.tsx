import { Link } from 'react-router';
import { usePageMeta } from '../meta';
import { Arrow, Mount } from '../ui';
import { lostPicture } from '../content/home';

export default function NotFound() {
  usePageMeta('Page not found');
  return (
    <div className="wrap grid page-inner lost">
      <Mount className="lost-frame">
        <img src={lostPicture.src} width={lostPicture.width} height={lostPicture.height} alt={lostPicture.alt} />
      </Mount>
      <div className="lost-text">
        <h1>Page not found</h1>
        <p className="lede">There is nothing at this address.</p>
        <Link to="/" className="btn btn-lg">
          Back to the homepage <Arrow />
        </Link>
      </div>
    </div>
  );
}
