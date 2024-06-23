// 将日期字符串转换为 "2022/09/19" 格式
function formatDate(dateString) {
  if (!dateString) return '';
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);

  return `${year}/${month}/${day}`;
}
// 格式化日期为 'October 11, 2023' 的格式
// function formatDate(dateString) {
//   const year = dateString.substring(0, 4);
//   const month = dateString.substring(4, 6);
//   const day = dateString.substring(6, 8);
//   const dateObj = new Date(year, month - 1, day);
//   const options = { year: 'numeric', month: 'long', day: 'numeric' };
//   return dateObj.toLocaleDateString('en-US', options);
// }
export {
  formatDate
}