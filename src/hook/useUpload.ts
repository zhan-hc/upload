import {uploadFile, mergeFile, continueFile} from '../api/user'
import SparkMD5 from 'spark-md5'
import {computed, reactive} from 'vue'
import axios from 'axios'
const Status = {
  wait: "wait",
  pause: "pause",
  uploading: "uploading",
  error: "error",
  done: "done",
};
const size = 5*1024*1024
interface chunkFileType {
  formData: FormData,
  progress?: number,
  cancel? : any,
  index: number,
  status: string
}
export default function useUploader () {
  const data = reactive({
    fileHash: '',
    fileName: '',
    chunkSize: 0, // 切片的大小
    chunkList: [] as Array<chunkFileType>
  })
  const totalPercent = computed(() => {
    return data.chunkList.length && (data.chunkList.map(item => item.progress || 0).reduce((prev, curr) => prev + curr) / data.chunkList.length).toFixed(2)
  })
  
  const CancelToken = axios.CancelToken;
  let source = CancelToken.source();

  // 对文件进行切片
  const createFileChunk = (file: File, chunkSize = size) => {
    data.chunkSize = chunkSize
    const chunkList = []
    let cur = 0
    while(cur < file.size) {
      chunkList.push(file.slice(cur, cur + chunkSize))
      cur += chunkSize
    }
    return chunkList
  }
  // 取消上传
  const handleCancel = () => {
    source.cancel("中断上传!")
    source = CancelToken.source();
  }
  // 合并切片
  const handleMerge = () => {
    const params = {
      filehash: data.fileHash,
      fileName: data.fileName,
      chunkLen: data.chunkList.length,
      chunkSize: data.chunkSize
    }
    mergeFile(params).then(res => {
      console.log(res)
    })
  }

  const handleChange = async (e: any) => {
    const file = e.target.files[0]
    data.fileName = file.name
    data.fileHash = await calcHashSample(file)
    data.chunkList = createFileChunk(file).map((chunk, i) => {
      const formData = new FormData()
      formData.append('chunk', chunk)
      formData.append("hash", `${i}`);
      formData.append("filename", file.name);
      formData.append("fileHash", data.fileHash);
      return{
        formData,
        index: i,
        status: Status.wait,
        progress: 0
      }
    })
    await sendRequest(data.chunkList)
    console.log(data.chunkList, 'data.chunkList')
  }
  // 续传
  const handleContinue = async () => {
    const params = {
      filehash: data.fileHash,
      chunkLen: data.chunkList.length
    }
    const [err, res]:any = await continueFile(params)
    const uploadIndex = res.data.uploadIndex || []
    // 获取未上传的切片
    const notUploadChunkList = data.chunkList.filter(item=> !uploadIndex.includes(item.index))
    const reqList:any[] = []
    notUploadChunkList.forEach(item => {
      reqList.push(uploadFile(item.formData, {filehash: data.fileHash, index: item.index}, (progress: number) => {
        data.chunkList[item.index].progress = progress
      },source.token)
      )
    })
    
    const uploadRes = Promise.all(reqList)
    uploadRes.then(res => {
      console.log(res, 'res')
    })

  }
  // 抽样hash
  const calcHashSample = (file: File, chunkSize: number=size):Promise<string> => {
    const startTime = +new Date()
    console.log(startTime, '抽样hash开始时间')
    return new Promise((resolve, reject) => {
      const spark = new SparkMD5.ArrayBuffer(),
      fileReader = new FileReader();
      const fileSize = file.size
      // 取第一个切片
      let chunkList = [file.slice(0, chunkSize)]
      // 当前切片开始位置
      let cur = chunkSize
      while(cur <  fileSize) {
        const mid = cur + chunkSize / 2
        const end = cur + chunkSize
        if (cur + chunkSize > fileSize) {
          chunkList.push(file.slice(cur, cur + chunkSize))
        } else {
          // 前
          chunkList.push(file.slice(cur, cur + 2))
          // 中
          chunkList.push(file.slice(mid, mid + 2))
          // 后
          chunkList.push(file.slice(end - 2, cur + end))
        }
        cur += chunkSize
      }
      // 拼接
      fileReader.readAsArrayBuffer(new Blob(chunkList));
      fileReader.onload = function (e) {
        spark.append(e.target?.result)
        const endTime = +new Date()
        console.log('抽样hash结束时间:',endTime, '抽样总花费时间:', endTime-startTime)
        resolve(spark.end())
      }
    })
    
  }
  // 全量hash
  const calcHashHard = (file: File, chunkSize: number=size) => {
    const startTime = +new Date()
    console.log(startTime, '全量hash开始时间')
    return new Promise((resolve, reject) => {
      const spark = new SparkMD5.ArrayBuffer(),
      fileReader = new FileReader();
      const fileSize = file.size
      // 取第一个切片
      // 当前切片开始位置
      let cur = 0
      let chunkList = []
      while(cur <  fileSize) {
        chunkList.push(file.slice(cur, cur + chunkSize))
        cur += chunkSize
      }
      // 拼接
      fileReader.readAsArrayBuffer(new Blob(chunkList));
      fileReader.onload = function (e) {
        spark.append(e.target?.result)
        const endTime = +new Date()
        console.log('全量hash结束时间:',endTime, '全量总花费时间:', endTime-startTime)
        resolve({fileHash: spark.end()})
      }
    })
  }

  const chunkProgress = (progress:number, index: number) => {
    data.chunkList[index].progress = progress
  }
  // 并发控制
  const sendRequest = (list:any, max: number = 4):Promise<void> => {
    const len = list.length;
    const result = new Array(len).fill(false);
    return new Promise ((resolve, reject) => {
      let count = 0
      const reqMax = Math.min(len, max)
      while(count < reqMax) {
        start()
      }
      function start () {
        let current = count++
        // 处理边界条件
        if (current >= len) {
          // 请求全部完成就将promise置为成功状态, 然后将result作为promise值返回
          !result.includes(false) && resolve();
          return;
        }
        const index = list[current].index
        const headerData = {filehash: data.fileHash, index}
        uploadFile(list[current].formData, headerData, (progress: number) => chunkProgress(progress, index),source.token).then(res => {
          list[current].status = Status.done
          if (current === len) {
            resolve()
          } else {
            start();
          }
        }).catch((err) => {
          list[current].status = Status.error
        })
      }
    })
  }
  return {
    data,
    createFileChunk,
    totalPercent,
    handleCancel,
    handleMerge,
    handleChange,
    calcHashHard,
    handleContinue,
    calcHashSample,
    sendRequest
  }
}