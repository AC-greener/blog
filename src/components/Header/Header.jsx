export default function Header() {
  return (
    <header className="h-[72px] leading-[72px]">
      <nav>
        <div>
          <a className="text-lg text-neutral-600/80 hover:text-neutral-600" href="/">Home</a>
          {/* <!-- <a href="/about">关于</a> --> */}
          {/* <a href="/blog">blog</a> */}
          {/* <a href="/tags/astro">Tag</a> */}
        </div>
      </nav>
    </header>
  );
}
