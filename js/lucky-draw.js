new Vue({
  el: "#app",
  template: `
    <div class="lucky-draw-view">
      <!-- 右上角设置按钮、下载按钮、重置按钮 -->
      <div class="lucky-draw-settings-bar">
        <a-button shape="circle" icon="reload" class="lucky-draw-reset-btn" @click="resetWinners" />
        <a-button shape="circle" icon="setting" class="lucky-draw-settings-btn" @click="goSettings" />
        <a-button v-if="winningUsers.length > 0" shape="circle" icon="download" class="lucky-draw-download-btn" @click="downloadWinningUsers" />
      </div>
      <!-- 右上角中奖列表 -->
      <div v-if="winningUsers.length > 0" class="lucky-draw-winners-list">
        <div class="winners-title">Winners</div>
        <div class="winner-item" v-for="item in winningUsers" :key="item.round">
          <span class="winner-round">Round {{ item.round }}</span>
          <span v-if="item.award" class="winner-award">- {{ item.award }}</span>
          <span class="winner-names">: {{ item.names }}</span>
        </div>
      </div>
      <!-- 抽奖显示页面 -->
      <div :class="isLuckyDraw ? 'lucky-draw-content lucky-draw-start' : 'lucky-draw-content'">
        <div :class="isLuckyDraw ? 'lucky-draw-users lucky-draw-users-start' : 'lucky-draw-users'">
          <div class="lucky-draw-user" v-for="item in users" :key="index">
            <div class="lucky-draw-user-name">{{ item.name }}</div>
            <div class="lucky-draw-user-department">{{ item.department }}</div>
          </div>
          <div v-if="showAllDrawn && isLuckyDraw && !luckyDrawTime" class="ucky-draw-empty" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px;">
            <div v-if="noUsers" style="font-size: 2rem; font-weight: bold; color: #222; margin-bottom: 32px; text-align: center;">No participant list found. Please upload a list first.</div>
            <div v-else>All participants have been drawn.</div>
            <div style="margin: 24px 0; display: flex; justify-content: center;">
              <a-button type="primary" style="margin-right: 12px; min-width: 160px;" @click="goUpload">Upload New List</a-button>
              <a-button v-if="!noUsers" type="default" style="min-width: 160px;" @click="restartDraw">Restart With Current List</a-button>
            </div>
          </div>
        </div>
      </div>
      <!-- 设置奖项，人数（如需保留可显示，否则可注释） -->
      <!-- <div class="lucky-draw-tool-left"> ... </div> -->
      <!-- 抽奖按钮固定底部居中 -->
      <div class="lucky-draw-btn-fixed" v-if="animationReady">
        <a-button
          class="lucky-draw-btn-main"
          :class="{
            'btn-start': !isLuckyDraw,
            'btn-stop': isLuckyDraw && luckyDrawTime,
            'btn-ending': isLuckyDraw && !luckyDrawTime
          }"
          type="primary"
          size="large"
          @click="luckyDraw"
        >
          <template v-if="isLuckyDraw && luckyDrawTime">
            <span class="btn-ekg-container">
              <span class="btn-ekg-label">Stop</span>
              <span class="btn-ekg-svg">
                <svg viewBox="0 0 60 20" class="ekg-svg">
                  <polyline
                    class="ekg-polyline"
                    fill="none"
                    stroke="#fff"
                    stroke-width="2"
                    points="0,10 10,10 15,2 20,18 25,10 35,10 40,5 45,15 50,10 60,10"
                  />
                </svg>
              </span>
            </span>
          </template>
          <template v-else>
            <template v-if="isLuckyDraw && !luckyDrawTime">
              <span class="btn-next-label">Next round</span>
            </template>
            <template v-else>
              {{ isLuckyDraw ? (luckyDrawTime ? 'Stop' : 'Start') : 'Start' }}
            </template>
          </template>
        </a-button>
      </div>
    </div>
  `,
  data() {
    return {
      // 当前第几轮抽奖
      number: 1,
      tempNumber: 0,
      // 抽奖人数
      numberPeople: 1,
      // 抽奖状态
      isLuckyDraw: false,
      // 滚动名单
      users: [],
      lastUsers: [],
      // 0 默认抽奖模式，1 自定义抽奖模式
      modeType: 0,
      // 自定义奖项列表
      customs: [],
      // 当前选中奖项
      custom: undefined,
      // 中奖人员
      winningUsers: [],
      // 剩余未中奖人数
      surplusUsers: [],
      // 滚动定时器
      luckyDrawTime: undefined,
      animationReady: false,
      showAllDrawn: false,
      // 新增：无名单标记
      noUsers: false,
    };
  },
  mounted() {
    // 检查名单
    const usersStr = localStorage.getItem("users");
    let usersArr = [];
    try {
      usersArr = JSON.parse(usersStr) || [];
    } catch (e) {
      usersArr = [];
    }
    if (!usersArr || !Array.isArray(usersArr) || usersArr.length === 0) {
      this.noUsers = true;
      this.showAllDrawn = true;
      this.users = [];
      this.surplusUsers = [];
      // 其他初始化可省略
    } else {
      this.noUsers = false;
      this.users = usersArr;
      this.surplusUsers = [...usersArr];
      // 获取模式
      const modeType = localStorage.getItem("modeType");
      if (modeType) {
        this.modeType = Number(modeType);
      } else {
        this.modeType = 0;
      }
      // 获取自定义列表
      this.customs = JSON.parse(localStorage.getItem("customs")) || [];
      // 获取中奖用户
      this.winningUsers =
        JSON.parse(localStorage.getItem("winning-users")) || [];
      // 初始化轮数
      this.tempNumber = this.winningUsers.length;
      this.number = this.tempNumber + 1;
      // 清理中奖用户
      this.winningUsers.forEach((item) => {
        const ids = item.ids.split("、").map(Number);
        ids.forEach((id) => {
          const index = this.surplusUsers.findIndex((user) => user.id === id);
          if (index !== -1) {
            this.surplusUsers.splice(index, 1);
          }
        });
      });
    }
    // 动画结束后才允许操作按钮
    setTimeout(() => {
      this.animationReady = true;
    }, 4000);
  },
  methods: {
    // 切换奖项
    handleModeTypeChange(value, e) {
      // 记录奖项
      this.custom = e.data.attrs.item;
    },
    luckyDraw() {
      // 是否在抽奖
      if (this.isLuckyDraw) {
        this.stopLuckyDraw();
      } else {
        // 抽奖前判断是否还有剩余用户
        if (this.surplusUsers.length === 0) {
          this.showAllDrawn = true;
          this.isLuckyDraw = true;
          return;
        } else {
          this.showAllDrawn = false;
        }
        // 准备开始抽奖
        if (this.modeType == 1 && !this.custom) {
          this.$message.error("Please select an award");
          return;
        }
        if (!this.numberPeople) {
          this.$message.error("Please set the number of drawers");
          return;
        }
        if (!REG_IS_INTEGER(this.numberPeople)) {
          this.$message.error("The number of drawers must be a whole number");
          return;
        }
        if (this.numberPeople <= 0) {
          this.$message.error(
            "The number of raffle winners must be greater than 0"
          );
          return;
        }
        if (this.numberPeople > users.length) {
          this.$message.error(
            `There are ${users.length} people on the draw list, the number of people filling out the draw must be less than or equal to ${users.length}`
          );
          return;
        }
        // 开始抽奖
        this.startLuckyDraw();
      }
    },
    // 开始抽奖
    startLuckyDraw() {
      if (this.tempNumber != this.number) {
        this.tempNumber = this.number;
        setAnimate("sphere");
        setTimeout(() => {
          this.isLuckyDraw = true;
          this.infiniteCycle();
          this.GetUsers();
        });
      }
    },
    // 停止抽奖
    stopLuckyDraw() {
      if (this.tempNumber === this.number) {
        if (this.luckyDrawTime) {
          clearInterval(this.luckyDrawTime);
          this.luckyDrawTime = undefined;
          this.users = this.lastUsers;
          this.saveWinningUsers();
          // 新增：立即停止球体自转
          stopAnimate("sphere");
          // 这里不判断 showAllDrawn，等到 luckyDrawTime 变为 null 时判断
        } else {
          // Ending the round 阶段，判断剩余人数
          if (this.surplusUsers.length === 0) {
            this.showAllDrawn = true;
          } else {
            this.showAllDrawn = false;
          }
          this.isLuckyDraw = false;
          this.numberPeople = 1;
          this.number += 1;
          setAnimate("table"); // 恢复为初始动画
          stopAnimate("sphere"); // 确保球体自转也停止
        }
      }
    },
    // 循环名单
    infiniteCycle() {
      if (this.luckyDrawTime) {
        clearInterval(this.luckyDrawTime);
        this.luckyDrawTime = undefined;
      }
      this.luckyDrawTime = setInterval(() => {
        this.updateNumberUsers();
      }, 40);
    },
    // 更新抽奖名单
    updateNumberUsers() {
      const tempUsers = [];
      var number = 0;
      const total = users.length;
      while (number < this.numberPeople) {
        const index = parseInt(Math.random() * total);
        const user = users[index];
        if (user) {
          tempUsers.push(user);
        }
        number++;
      }
      this.users = tempUsers;
    },
    GetUsers() {
      // 剩余用户
      const surplusUsers = [...this.surplusUsers];
      const lastUsers = [];
      // 标记用户
      surplusUsers.forEach((user) => {
        // 编号有值
        if (user.number > 0) {
          if (this.modeType == 0) {
            // 默认抽奖模式
            if (user.number == this.number) {
              if (lastUsers.length < this.numberPeople) {
                lastUsers.push(user);
                const index = this.surplusUsers.indexOf(user);
                if (index !== -1) {
                  this.surplusUsers.splice(index, 1);
                }
              }
            }
          } else if (this.modeType == 1) {
            // 自定义奖项模式
            if (user.number == this.custom.tag && this.custom.tag != 0) {
              if (lastUsers.length < this.numberPeople) {
                lastUsers.push(user);
                const index = this.surplusUsers.indexOf(user);
                if (index !== -1) {
                  this.surplusUsers.splice(index, 1);
                }
              }
            }
          } else {
          }
        }
      });
      // 随机用户
      while (
        this.surplusUsers.length > 0 &&
        lastUsers.length < this.numberPeople
      ) {
        const index = parseInt(Math.random() * this.surplusUsers.length);
        const user = this.surplusUsers[index];
        if (user) {
          const index = this.surplusUsers.indexOf(user);
          if (index !== -1) {
            lastUsers.push(user);
            this.surplusUsers.splice(index, 1);
          }
        }
      }
      // 打乱顺序
      var length = lastUsers.length;
      if (length > 1) {
        for (var i = 0; i < length - 1; i++) {
          var index = parseInt(Math.random() * (length - i));
          var temp = lastUsers[index];
          lastUsers[index] = lastUsers[length - i - 1];
          lastUsers[length - i - 1] = temp;
        }
      }
      // 记录数据
      this.lastUsers = lastUsers;
    },
    // 保存中奖名单
    saveWinningUsers() {
      // 处理名称
      var usernames = [];
      var userids = [];
      this.lastUsers.forEach((user) => {
        // 名称
        if (user.department) {
          usernames.push(`${user.name}(${user.department})`);
        } else {
          usernames.push(user.name);
        }
        // id
        userids.push(user.id);
      });
      // 记录
      this.winningUsers.push({
        round: this.number,
        award: this.custom ? this.custom.name : "",
        names: usernames.join("、"),
        ids: userids.join("、"),
      });
      // 保存
      localStorage.setItem("winning-users", JSON.stringify(this.winningUsers));
    },
    // 下载中奖名单
    downloadWinningUsers() {
      // 列名称
      const columns = [
        {
          name: "Rounds",
          field: "round",
          style: {
            color: "#0000FF",
            alignmentHor: "Center",
            alignmentVer: "Center",
          },
        },
        {
          name: "Awards",
          field: "award",
          style: {
            color: "#0000FF",
            alignmentHor: "Center",
            alignmentVer: "Center",
          },
        },
        {
          name: "Winners",
          field: "names",
          style: {
            colWidth: 888,
            color: "#0000FF",
            borderColor: "#D5DBEA",
            backgroundColor: "#00FFFF",
          },
        },
      ];
      // 将要保存的 sheets 数据源
      const sheets = [
        {
          // 单个 sheet 名字
          name: "Winners List",
          // 单个 sheet 数据源
          data: this.winningUsers,
          // 单个 sheet 列名称与读取key
          columns: columns,
        },
      ];
      // 下载
      EXDownloadManager(
        sheets,
        function (
          item,
          field,
          json,
          sheetIndex,
          row,
          col,
          columnCount,
          rowCount
        ) {
          // 处理标题行
          if (row === 0) {
            // 内容横向排版：Left、Center、Right
            item.style.alignmentHor = "Center";
            // 内容竖向排版：Top、Center、Bottom
            item.style.alignmentVer = "Center";
            // 行高
            item.style.rowHeight = 32;
          }
          // 返回
          return item;
        }
      );
    },
    goUpload() {
      window.location.href = "lottery-conf.html";
    },
    restartDraw() {
      // 清空中奖名单，重置抽奖状态，重新开始
      localStorage.removeItem("winning-users");
      window.location.reload();
    },
    goSettings() {
      window.location.href = "lottery-conf.html";
    },
    resetWinners() {
      localStorage.removeItem("winning-users");
      window.location.reload();
    },
  },
});
