const SET_COOKIE = "set-cookie";

export const withHeaders = (response: Response, headers: Headers): Response => {
  headers.forEach((value, name) => {
    if (name.toLowerCase() !== SET_COOKIE) {
      response.headers.set(name, value);
    }
  });
  for (const cookie of headers.getSetCookie()) {
    response.headers.append(SET_COOKIE, cookie);
  }
  return response;
};
