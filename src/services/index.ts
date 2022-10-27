// index.ts
import MyAxios from './axios'

const MyRequest =  new MyAxios({
  baseURL: '/',
  timeout: 1000*60,
  interceptors: {
    // 实例请求拦截器
    requestInterceptors: config => {
      return config
    },
    // 实例响应拦截器
    responseInterceptors: res => {
      return res
    }
  }
})

export default MyRequest

