import "./Header.less"
export default function Header() {
  return (
    <header>
      <nav>
        <div class="nav-links">
          <a href="/">Home</a>
          {/* <!-- <a href="/about">关于</a> --> */}
          {/* <a href="/blog">blog</a> */}
          {/* <a href="/tags/astro">Tag</a> */}
        </div>
      </nav>
    </header>
  );
}
