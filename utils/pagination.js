export default async function (model, page, limit, filter) {
  //pagination
  const total = await model.count({ where: filter });
  const pageCount = Math.ceil(total / limit);
  const start = (page - 1) * limit + 1;
  let end = start + limit - 1;
  if (end > total) end = total;
  const pagination = { total, pageCount, start, end, limit, page };

  if (page < pageCount) pagination.nextPage = page + 1;
  if (page > 1) pagination.prevPage = page - 1;

  return pagination;
}