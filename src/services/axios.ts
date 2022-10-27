import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {RequestInterceptors, RequestConfig, RequestOptions} from './type'
import { AxiosCanceler } from './cancel'
import { handleNetworkError } from './tool';

class MyAxios {
  instance: AxiosInstance;
  interceptorsObj?: RequestInterceptors;
  customOptions?: RequestOptions;
  constructor(config: RequestConfig) {
    this.instance = axios.create(config)
    this.interceptorsObj = config.interceptors
    this.customOptions = {
      repect_request_cacel: false
    }
    const AxiosCancel = new AxiosCanceler()

    /**
     * @description: 全局请求之前的拦截器
     */
    this.instance.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        // 取消重复请求
        this.customOptions?.repect_request_cacel && AxiosCancel.addPending(config)

        // 添加token
        const token = localStorage.getItem('xxx_token')
        if (token && config.headers) {
          config.headers.Authorization = token
        }
        return config
      },
      (err: any) => err
    )

    // config实例对应的拦截器
    this.instance.interceptors.request.use(
      this.interceptorsObj?.requestInterceptors,
      this.interceptorsObj?.requestInterceptorsCatch
    )
    this.instance.interceptors.response.use(
      this.interceptorsObj?.responseInterceptors,
      this.interceptorsObj?.responseInterceptorsCatch
    )

    /**
     * @description: 全局响应之后的拦截器
     */
    this.instance.interceptors.response.use(
      (res: AxiosResponse) => {
        // 清除已响应的请求
        AxiosCancel.removePending(res.config)
        return res
      },
      (err: any) => {
        console.error(handleNetworkError(err?.response?.status || err.code), err.message)
      }
    )
  }

  request<T>(config: RequestConfig): Promise<[any, T | undefined]> {
    return new Promise((resolve, reject) => {
      if (config.interceptors?.requestInterceptors) {
        config.interceptors.requestInterceptors(config)
      }
      this.instance.request<any, T>(config).then(res => {
        if (config.interceptors?.responseInterceptors) {
          config.interceptors.responseInterceptors(res)
        }
        resolve([null, res])
      })
      .catch((err) => {
        reject([err, undefined])
        return err
      })
    })
  }
}

export default MyAxios