import Pusher from 'pusher';

function requireEnv<T extends Array<string>>(...names: T) {
  if (names.length == 0) {
    throw new Error(`At least one variable name must be provided`)
  }
  return names.reduce((acc, name) => {
    if (process.env[name] === undefined) {
      throw new Error(`Missing environment variable: ${name}`)
    }
    return { ...acc, [name]: process.env[name] }
  }, {}) as { [name in T[number]]: string }
}


export default async function handler(request){
  const {PUSHER_KEY, PUSHER_ID, PUSHER_SECRET, PUSHER_CLUSTER} = requireEnv('PUSHER_KEY', 'PUSHER_ID', 'PUSHER_SECRET', 'PUSHER_CLUSTER')
  const pusher = new Pusher({
    appId: PUSHER_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster:PUSHER_CLUSTER,
  });

  const formData = await request.formData();
  const socketId = formData.get('socket_id') as string;
  const channel = formData.get('channel_name') as string;
  const authResponse = pusher.authorizeChannel(socketId, channel);
  return Response.json(authResponse);
}
