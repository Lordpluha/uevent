export function loader() {
  return new Response('{}', {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export default function ChromeDevtoolsProbeRoute() {
  return null;
}
