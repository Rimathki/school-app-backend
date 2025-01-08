// const { Op } = require("sequelize");
import { Op } from "sequelize";

export const formatQuery = (query) => {
  //
  let query_with_op = {};

  Object.keys(query).forEach((key) => {
    const keys = Object.keys(query[key]);
    if (keys.length === 2) {
      query_with_op[key] = {
        [Op.and]: {
          [Op[keys[0]]]: query[key][keys[0]],
          [Op[keys[1]]]: query[key][keys[1]],
        },
      };
    } else if (keys.length === 1) {
      let param = query[key][keys[0]];
      if (param.includes("%")) {
        const decodedParam = param.slice(1, param.length - 1);
        param = "%" + decodeURI(decodedParam) + "%";
        query_with_op[key] = { [Op[keys[0]]]: param };
      } else {
        query_with_op[key] = { [Op[keys[0]]]: param };
      }
    }

    // Object.keys(query[key]).forEach((op) => {
    //   let param = query[key][op];
    //   if (param.includes("%")) {
    //     const decodedParam = param.slice(1, param.length - 1);
    //     param = "%" + decodeURI(decodedParam) + "%";
    //     query_with_op[key] = { [Op[op]]: param };
    //   } else {
    //     query_with_op[key] = { [Op[op]]: param };
    //   }
    // });
  });
  return query_with_op;
};

export function padTo2Digits(num) {
  return num.toString().padStart(2, "0");
}

export const formattedDateNow = () => {
  const date = new Date(Date.now());

  const dateString = [
    date.getFullYear(),
    padTo2Digits(date.getMonth() + 1),
    padTo2Digits(date.getDate()),
  ].join("-");

  const timeString = [
    padTo2Digits(date.getHours() + 1),
    padTo2Digits(date.getMinutes()),
    padTo2Digits(date.getSeconds()),
  ].join(":");

  return dateString + " " + timeString;
};

export const formatDate = (dateString, addYear = false) => {
  if (dateString === undefined) return;
  let date = new Date(dateString);
  if (addYear) date.setFullYear(date.getFullYear() + addYear);
  return [
    date.getFullYear(),
    padTo2Digits(date.getMonth() + 1),
    padTo2Digits(date.getDate()),
  ].join("-");
};

export const formatDateTime = (dateString) => {
  if (dateString === undefined) return;

  const date = new Date(dateString);

  return (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join("-") +
    " " +
    [
      padTo2Digits(date.getHours()),
      padTo2Digits(date.getMinutes()),
      padTo2Digits(date.getSeconds()),
    ].join(":")
  );
};

export const formatDateRaw = (dateString) => {
  let date = new Date(dateString);
  return [
    date.getFullYear(),
    padTo2Digits(date.getMonth() + 1),
    padTo2Digits(date.getDate()),
  ].join("");
};

export function getDateByISOString(date) {
  return new Date(date).toISOString().split(".")[0] + "Z";
}

export function formatDateTimeWithoutSeconds(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
