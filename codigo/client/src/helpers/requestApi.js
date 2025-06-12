import { apiUrl } from "../Global";

const requestApi = async (
  route,
  {
    method = 'GET',
    headers = { 'Content-Type': 'application/json' },
    body = null
  } = {}
) => {
  try {
    // Convert FormData to plain object if needed
    if (body instanceof FormData) {
      const plainObject = Object.fromEntries(body.entries());
      body = plainObject;
    }

    const options = {
      method,
      headers,
      credentials: 'include',
      ...(body && { body: JSON.stringify(body) })
    };

    const response = await fetch(apiUrl + route, options);
    const contentType = response.headers.get('Content-Type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data,
        data: null
      };
    }

    return {
      ok: true,
      status: response.status,
      data,
      error: null
    };
  } catch (err) {
    return {
      ok: false,
      status: null,
      data: null,
      error: err.message || err.toString()
    };
  }
};

export default requestApi