export default function Header() {
  return (
    <header className="h-[72px] leading-[72px]">
      <nav>
        <div>
          <a className="text-lg text-neutral-600/80 hover:text-neutral-600 mr-8" href="/">Home</a>
          <a className="text-lg text-neutral-600/80 hover:text-neutral-600 mr-8"  href="/about">About</a>
          {/* <a href="/blog">blog</a> */}
          {/* <a href="/tags/astro">Tag</a> */}
        </div>
      </nav>
    </header>
  );
}
