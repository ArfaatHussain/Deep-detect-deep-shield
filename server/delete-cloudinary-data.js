import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dp2iwpkeq',
  api_key: '829318931548584',
  api_secret: 'xaQt_SQh6FceLXXtT9fMFQm5mhA'
});

// Delete all resources
await cloudinary.api.delete_all_resources();

// Delete derived (transformed) resources
await cloudinary.api.delete_all_resources({ keep_original: false });