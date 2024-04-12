import "./BlogList.less";

export default function BlogList() {
  const list = [
    {
      title: "Your Roadmap to Framework Selection Success",
      url: "/a",
      // render date month and day after title => October 11, 2023
      date: "20240421",
    },
    {
      title: "Learning CSS in 2024: Tips and Tricks",
      url: "/b",
      date: "20240421",
    },
  ];
 // 格式化日期为 'October 11, 2023' 的格式
 function formatDate(dateString) {
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);

  // 创建一个日期对象
  const dateObj = new Date(year, month - 1, day);

  // 选项用于控制格式
  const options = { year: 'numeric', month: 'long', day: 'numeric' };

  // 使用toLocaleDateString方法以一个更可读的格式来显示日期
  return dateObj.toLocaleDateString('en-US', options);
}
  return (
    <>
      <div className="blog-title">Blog</div>
      <div className="blog-list">
        {list.map((item, index) => (
          <div key={index} className="blog-post">
            <a href={item.url}>
            {item.title} <span className="post-date">{formatDate(item.date)}</span>
            </a>
          </div>
        ))}
      </div>
    </>
  );
}
