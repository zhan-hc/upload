<template>
  <div>
    <!-- <div class="aa" @click="getUserApi">api的调用</div> -->
    抽样hash<input type="file" name="file" id="file" @change="handleChange" /> <br>
    <!-- 全量hash<input type="file" name="file1" id="file1" @change="handleChange1" /> <br> -->
    <button @click="handleMerge">合并</button>
    <button @click="handleCancel">取消</button>
    <button @click="handleContinue">续传</button>
    <p>总进度： {{totalPercent}} %</p>
    <!-- <ul>
      <li v-for="(item, i) in data.chunkList" :key="i">{{`第${i+1}个切片，进度：${item.progress}%`}}</li>
    </ul> -->
    <div class="cube-container">
      <div class="cube" 

        v-for="chunk in data.chunkList" 
        :key="chunk.hash">
        <div           
          :class="{
          'uploading':chunk.progress>0&&chunk.progress<100, 
          'success':chunk.progress==100,
          'error':chunk.progress<0,
          }" 
          :style="{height:chunk.progress+'%'}"
          >
          {{chunk.index}}
          <!-- <i v-if="chunk.progress<100" class="el-icon-loading" style="color:#F56C6C;"></i> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script lang='ts' setup>
import useUpload from '../hook/useUpload'
// 
const {data, handleMerge, totalPercent, handleChange, handleCancel, handleContinue} = useUpload()


// const handleCancel = () => {
//   data.chunkList.map((item) => {
//     item.cancel.cancel()
//   })
// }

</script>

<style scoped >
.cube-container {
  width: 200px;
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
}
.cube{
  width: 50px;
  height: 50px;
  line-height: 50px;;
  border: 1px solid black;
  background : #eee;
  }

  .cube > .success{
    background: #67C23A;
    }
  .cube > .uploading{
    background: #409EFF;
    }
  .cube > .error{
    background: #F56C6C;
  }

</style>