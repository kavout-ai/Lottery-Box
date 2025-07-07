// 自定义抽奖弹窗组件
const CustomLuckyDrawDrawer = {
  data() {
    return {
      // 显示状态
      visible: false,
      // 自定义列表
      customs: [],
    };
  },
  template: `
    <a-drawer
      title="Custom Awards"
      width="500px"
      placement="right"
      :visible="visible"
      @close="onClose"
    >
      <!-- 提示 -->
      <a-alert
        class="custom-hint" 
        message="Name is required, tag is optional. Closing will auto-save and remove awards with empty names!"
        type="info"
        show-icon
      />
      <!-- 自定义列表 -->
      <div class="custom-item" v-for="(item, index) in customs" :key="index">
        <div>Name:</div>
        <a-input
          class="custom-item-input-name"
          placeholder="e.g. First Prize"
          v-model="item.name"
        />
        <div style="margin-left: 20px;">Tag:</div>
        <a-input
          class="custom-item-input-tag"
          placeholder="Enter a number > 0"
          v-model="item.tag"
        />
        <a-button
          class="custom-item-delete"
          type="primary"
          shape="circle"
          size="small"
          @click="touchDelete(index)"
        >
        ×
        </a-button>
      </div>
      <!-- 添加按钮 -->
      <a-button
        class="custom-add-btn"
        type="dashed"
        @click="touchAdd"
      >
        Add Award
      </a-button>
    </a-drawer>
  `,
  methods: {
    // 显示抽屉
    showDrawer() {
      // 获取自定义列表
      this.customs = JSON.parse(localStorage.getItem("customs")) || [];
      // 显示
      this.visible = true;
    },
    // 关闭抽屉
    onClose() {
      // 过滤空名称奖项
      const customs = this.customs.filter((item) => {
        return !!item.name;
      });
      // 转成 json
      const jsonString = JSON.stringify(customs);
      // 存储到 localStorage
      localStorage.setItem("customs", jsonString);
      // 关闭窗口
      this.visible = false;
      // 回调
      this.$emit("close");
    },
    // 新增
    touchAdd() {
      const custom = {
        name: undefined,
        tag: undefined,
      };
      this.customs.push(custom);
    },
    // 删除
    touchDelete(index) {
      this.customs.splice(index, 1);
    },
  },
};

// 主视图
new Vue({
  el: "#app",
  components: {
    CustomLuckyDrawDrawer,
  },
  template: `
    <div class="import-view">
      <!-- 上传名单 -->
      <a-upload
        class="operation-button import-users"
        :disabled="isLoading"
        accept=".xlsx,.xls,.csv"
        :fileList="[]"
        :beforeUpload="beforeUpload"
        :customRequest="customRequest" 
      >
        <a-button
          :type="isImportUsers ? 'primary' : 'default'"
          :loading="isLoading"
          style="width: 180px"
        >
          {{ isImportUsers ? 'Update Participants' : 'Upload Participants' }}
          <a-icon type="upload" />
        </a-button>
        <a-icon
          v-if="isImportUsers"
          class="operation-success-icon"
          type="check-circle"
        />
      </a-upload>
      <!-- 进入抽奖池 -->
      <a-button
        class="operation-button"
        :type="isImportUsers ? 'default' : 'default'"
        :disabled="isLoading || !isImportUsers"
        @click="touchLuckyDrawPage"
        style="width: 180px; color: #1bc47d; font-weight: bold; border: 2px solid #1bc47d;"
      >
        Start Lottery
        <a-icon type="arrow-right" />
      </a-button>
      <!-- 切换模式 -->
      <div class="operation-button import-mode" style="display:none;">
        <a-select
          v-model="modeType"
          @change="handleImportModeChange"
        >
          <a-select-option :value="0">Default Mode</a-select-option>
          <a-select-option :value="1">Custom Awards Mode</a-select-option>
        </a-select>
        <a-icon
          v-if="modeType == 1 && isImportMode"
          class="operation-success-icon"
          type="check-circle"
        />
      </div>
      <!-- 设置按钮 -->
      <a-button
        v-if="modeType == 1"
        class="operation-button import-setting"
        type="primary"
        shape="circle"
        @click="touchCustom"
        style="width: 180px"
      >
        <a-icon type="setting" />
        Awards Settings
      </a-button>
      <!-- 重置按钮 -->
      <a-button
        class="operation-button"
        @click="clearData"
        style="width: 180px"
      >
        Reset Participants
        <a-icon type="reload" />
      </a-button>
      <!-- 提示 -->
      <span class="import-hint">Supported: .xlsx, .csv <br>Winners will not be drawn again</span>
      <!-- 自定义抽奖组件 -->
      <custom-lucky-draw-drawer ref="custom-lucky-draw-drawer" @close="onCloseCustom"></custom-lucky-draw-drawer>
    </div>
  `,
  data() {
    return {
      // 0 默认抽奖模式，1 自定义抽奖模式
      modeType: 0,
      // 上传文件列表
      fileList: [],
      // 上传状态
      isLoading: false,
      // 用户列表
      users: [],
      // 是否导入了用户列表
      isImportUsers: false,
      // 是否有自定义奖项配置
      isImportMode: false,
    };
  },
  created() {
    // 获取抽奖模式
    const modeType = localStorage.getItem("modeType");
    if (modeType) {
      this.modeType = Number(modeType);
    } else {
      this.modeType = 0;
    }
    // 获取抽奖用户
    const users = localStorage.getItem("users");
    this.isImportUsers = users ? JSON.parse(users).length : false;
    // 获取自定义抽奖项
    this.onCloseCustom();
  },
  methods: {
    // 跳转
    touchLuckyDrawPage() {
      window.location.href = "./lottery-draw.html";
    },
    // 抽奖模式切换
    handleImportModeChange(e) {
      // 存储到 localStorage
      localStorage.setItem("modeType", e);
    },
    // 自定义抽奖组件
    touchCustom() {
      this.$refs["custom-lucky-draw-drawer"].showDrawer();
    },
    // 关闭自定义抽奖窗口
    onCloseCustom() {
      const customs = localStorage.getItem("customs");
      this.isImportMode = customs ? JSON.parse(customs).length : false;
    },
    // 清空数据
    clearData() {
      // 清空数据
      localStorage.clear();
      // 清空状态
      this.isImportUsers = false;
      this.isImportMode = false;
      this.modeType = 0;
      // 提示
      this.$message.success("Cleared successfully");
    },
    // 上传之前检查
    beforeUpload(file, fileList) {
      return true;
    },
    // 自定义上传名单
    customRequest(data) {
      // 数据记录
      this.users = [];
      // 进入加载
      this.isLoading = true;
      // 开始解析数据
      formJson(data.file, (code, sheets) => {
        // 解析成功且有数据
        if (code === 0) {
          // 解析数据
          sheets.forEach((sheet) => {
            // 单个 sheet
            sheet.list.forEach((row) => {
              // 单行
              row.forEach((item) => {
                // 每个单元格，解析成 user 对象存入数组
                const user = this.userJson(item);
                if (user) {
                  this.users.push(user);
                }
              });
            });
          });
          // 解析成 JSON 字符串
          const jsonString = JSON.stringify(this.users);
          // 存储到 localStorage
          localStorage.setItem("users", jsonString);
          // 标记为有数据
          this.isImportUsers = this.users.length;
          // 名单是否为空
          if (this.users.length) {
            // 名单有值
            this.$message.success("List uploaded successfully");
          } else {
            // 名单为空
            this.$message.error("The uploaded list is empty!");
          }
          // 结束加载
          this.isLoading = false;
        } else {
          // 结束加载
          this.isLoading = false;
          this.$message.success("List upload failed");
        }
      });
    },
    // 获取单个用户数据，传入单元格字段
    userJson(item) {
      // 分割字符串
      const items = item.split("-");
      const name = items[0] ? items[0].trim() : "";
      if (!name) return null;
      // 如果有3个字段
      if (items.length >= 3) {
        return {
          id: this.users.length,
          name: name,
          department: items[1],
          number: items[2],
        };
      }
      // 如果有2个字段
      if (items.length >= 2) {
        // 判断第二个是否为数字
        const isNumber = !isNaN(items[1]);
        return {
          id: this.users.length,
          name: name,
          department: isNumber ? "" : items[1],
          number: isNumber ? items[1] : 0,
        };
      }
      // 如果有1个字段
      if (items.length >= 1) {
        return {
          id: this.users.length,
          name: name,
          department: "",
          number: 0,
        };
      }
      return null;
    },
  },
});
