import MyRequest from '../services/index'
import axios, { CancelToken } from 'axios'
export const uploadFile = (data:any, headers:any = {}, callback: Function, cancelToken: CancelToken) => {
  return MyRequest.request({
    url: '/files/upload',
    method: 'POST',
    data: data,
    headers: {
      'Content-Type': 'multipart/form-data',
      ...headers
    },
    onUploadProgress: function (progressEvent) { //原生获取上传进度的事件
      const complete = Number(
        ((progressEvent.loaded / (progressEvent.total || 0)) * 100).toFixed(2)
    )
      console.log(progressEvent, data, '======')
      callback(complete)
    },
    cancelToken
  })
}

export const mergeFile = (data:any) => {
  return MyRequest.request({
    url: '/files/merge',
    method: 'POST',
    data: data
  })
}
export const continueFile = (data:any) => {
  return MyRequest.request({
    url: '/files/continue',
    method: 'POST',
    data: data
  })
}