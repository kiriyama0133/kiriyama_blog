<template>
  <div v-if="canGoBack" class="container fixed flex gap-4 p-4">
    <button
      type="button"
      class="btn shadow-lg flex items-center justify-center"
      title="返回"
      aria-label="返回"
      @click="goBack()"
    >
      <span class="icon" :style="returnIconStyle" aria-hidden="true" />
    </button>

    <button
      type="button"
      class="btn shadow-lg flex items-center justify-center"
      title="分享"
      aria-label="分享"
      @click="shareNote"
    >
      <span class="icon" :style="shareIconStyle" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import returnImg from '~/assets/image/return-svgrepo-com.svg'
import shareImg from '~/assets/image/share-nodes-svgrepo-com.svg'
import { useShareNote } from '~/composables/useShareNote'

const { canGoBack, goBack } = useNavigationStack()
const { shareNote } = useShareNote()

const returnIconStyle = {
  '-webkit-mask-image': `url("${returnImg}")`,
  'mask-image': `url("${returnImg}")`
}

const shareIconStyle = {
  '-webkit-mask-image': `url("${shareImg}")`,
  'mask-image': `url("${shareImg}")`
}
</script>

<style lang="scss" scoped>
.icon {
  display: inline-block;
  flex: none;
  width: 1rem;
  height: 1rem;
  background-color: currentColor;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}
</style>
