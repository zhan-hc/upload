const router = require('koa-router')()
const multer = require('koa-multer');//加载koa-multer模块
const fs = require('fs');
const path = require("path");
router.prefix('/files')

// 判断文件夹是否存在,不存在则创建
const ifExistFolder = (filePath, path = '') => {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath);
    return path;
  } else {
      return path; 
  }
}

// 读取切片并连接写入
const pipeStream = (path, writeStream) => {
  return new Promise(resolve => {
      const readStream = fs.createReadStream(path);
      readStream.on("end", () => {
          fs.unlinkSync(path); // 删除切片
          resolve();
      });
      // 连接数据流
      readStream.pipe(writeStream);
  });
}

// 上传 图片
const storage = multer.diskStorage({
  //文件保存路径
  destination: function(req, file, cb) {
    const {filehash} = req.headers
    const filePath = path.join(__dirname, `../public/uploads/cache/${filehash}`)
    cb(null, ifExistFolder(filePath, `public/uploads/cache/${filehash}`))
  },
  //修改文件名称
  filename: function(req, file, cb) {
    var fileFormat = (file.originalname).split(".");
    const {filehash, index} = req.headers
    cb(null, `${filehash}__${index}.${fileFormat[fileFormat.length - 1]}`);
  }
})
//加载配置
const upload = multer({
storage: storage
});

// 上传
router.post('/upload', upload.single('chunk'), async(ctx, next) => {
  ctx.body = {
    filename: ctx.req.file.filename //返回文件名
  }
})

// 合并
router.post('/merge', async(ctx, next) => {
  const {filehash, fileName, chunkLen, chunkSize} = ctx.request.body
  const chunkDir = path.join(__dirname,`../public/uploads/cache/${filehash}`) // 切片文件存储路径
  const cachePath = path.join(__dirname,`../public/uploads/files/${filehash}/${fileName}`) // 合并后文件路径
  // 创建一个文件夹
  ifExistFolder(path.join(__dirname,`../public/uploads/files/${filehash}`))
  const chunkPaths = fs.readdirSync(`public/uploads/cache/${filehash}`)
  // 按序号排序
  const sortChunk = chunkPaths.sort((a,b) =>  a.split('.')[0].slice(filehash.length + 2) - b.split('.')[0].slice(filehash.length + 2))
  if (chunkPaths.length < chunkLen) {
    ctx.body = {
      err: '有切片未上传'
    }
  } else {
    const arr = sortChunk.map((chunk, index) => {
      return pipeStream(
          path.resolve(chunkDir, chunk),
          // 指定位置创建可写流
          fs.createWriteStream(cachePath, {
              start: index * chunkSize,
              end: (index + 1) * chunkSize
          })
      )
    })
    await Promise.all(arr)
    // 删除临时存储的文件夹
    fs.rmdirSync(chunkDir);
    ctx.body = {
      filename: fileName, //返回文件名
      msg: '合并成功'
    }
  }
})

// 续传
router.post('/continue', async(ctx, next) => {
  const {filehash, chunkLen} = ctx.request.body
  let chunkPaths = fs.readdirSync(`public/uploads/cache/${filehash}`)
  if (chunkPaths.length < chunkLen) {
    const uploadIndex = chunkPaths.map(item => Number(item.split('.')[0].slice(filehash.length + 2)))
    ctx.body = {
      uploadIndex //已上传的索引
    }
  } else {
    ctx.body = {
      info: '分片已全部上传，不用重复上传'
    }
  }
  
})


module.exports = router
