/* Shared painting mechanics; each figure below declares its own visual roles. */
(() => {
  const root = document.getElementById('ie-demo') || document.querySelector('main');
  if (!root) return;
  const classic = root.id === 'ie-demo';
  const fileName = decodeURIComponent(location.pathname.split('/').pop());
  // Curated, page-specific assignments. The ids denote actual objects in each
  // drawing; labels and their wording never decide a color. The older painter
  // below remains only for figures that have their own subsequent art direction.
  const curated = [
    ['IO控制方式-读一个扇区', {blue:'cpu', green:'mem', orange:'dr sr cr', gold:'disk', violet:'dma'}],
    ['IO软件层次-一次write', {blue:'L0 R0 R1', orange:'L1 L2 L4', gold:'L3 R3', green:'L5 R2'}],
    ['RAID-数据分布与恢复', {blue:'logical source', gold:'disk0 disk1 disk2 disk3', green:'answer', orange:'array calc'}],
    ['SSD-映射与回收', {blue:'host', orange:'ftl', gold:'chip', green:'block0 block1'}],
    ['VFS-路径挂载与读取', {blue:'memory mounts', orange:'tree', green:'diskA sbA fileA', gold:'diskU sbU fileU'}],
    ['处理机调度-一张图走完', {blue:'cpu c-run c-remain c-quan c-prio', orange:'dev d-wait d-state wait-q', gold:'jobq job1 job2 swapq sw1 sw2', green:'mem m1 m2 m3 m4', violet:'sched'}],
    ['调度程序内部-分派与公平', {blue:'g1 pc sp ax cr3 cpu2 cpu4', orange:'queuer disp ctx q1 q2 q3 gpick', gold:'disk2', green:'pcbA pcbB rq rq2 wq2 kp1 lib kt1 kt2 kt3 gQ', violet:'gP'}],
    ['进程与线程-一张图走完', {blue:'cpu c-run c-pc c-eax c-esp c-cr3 t1 t2 t3 tstack', orange:'pcb1 pcb2 p1-pid p1-state p1-files p1-pc p1-ptbr p1-queue p2-pid p2-state p2-files p2-queue ready-q wait-q sched tcb tcb1 tcb2 tcb3 tcbgroup', green:'ptA ptA0 ptA1 ptB mem fr2 fr3 fr6 fr7 shm shm-a shm-b shm-lock', gold:'disk d-file d-buf m-code'}],
    ['经典同步问题-信号量', {blue:'P1 dad R1 R2', orange:'C1 mom dau', green:'buf0 buf1 buf2 plate0 file code', gold:'empty full mutex a12 a13 a24 a25 a36 a46 a56 S6 pc5 apple count plate rw w'}],
    ['空闲块-分配与回收', {blue:'ram', orange:'file', gold:'disk b42 b43 b44 b45 b46 b47', green:'inside'}],
    ['目录与inode-按路径', {blue:'fa0 fa1 fa2 fa3 fa4 fb0 fb1 fb2 fb3 ent cwd fcb l0 l1 l2 l3 l4 l5 l6', orange:'ino i2 i5 i9 i17 dk0 dk1 dk2 dk3 dk4 dk5 dk6 mcopy', gold:'b266 b300 b310 dd0 dd1 dd2', green:'trace'}],
    ['设备独立软件-缓冲分配', {blue:'L0 L1 L2 L3 R0 R1', orange:'M0 M1 M2 M3 M4 M5', gold:'R2 R3', green:'note'}],
    ['文件操作与共享-每一步', {blue:'g-fs u0 u1 u2 u3 v0 v1 dir rw0 rw1 rw2', orange:'n0 n1 n2 n3 dino own mode', green:'g-open pa0 pa3 pb0 pb3 t6 t7 t8', gold:'s0 s1 s2 s3 s4 ddat'}],
    ['文件访问-跨章节', {blue:'cpu fd pte', orange:'inode', green:'memory user cache result', gold:'controller disk b3 b9 b12 b20 b33 b41', violet:'zoom'}],
    ['文件分配方式-找第i块', {blue:'dirent aux', orange:'calc calc3', green:'data', gold:'g-grid k0 k1 k2 k3 k4 k5 k6 k7 k8 k9 k10 k11 k12 k13 k14 k15 k16 k17 k18 k19 k20 k21 k22 k23 k24 k25 k26 k27 k28 k29 k30 k31 a0 a1 a2 fat1 fat9 fat10 fat16 fat25 ix0 ix1 ix2 ix3 ix4 m0 m1'}],
    ['文件逻辑结构-找一个学生', {blue:'g1 b0 b1 b2 b3 ptr scan1', orange:'g2 f0 f1 f2 f3 f4 f5 f6 f7 v0 v1 v2 v3 v4 v5 v6 v7 fcalc', green:'g3 ix0 ix1 ix2 ix3 ix5 gi0 gi1 gi2 gi3 h0 h1 h5 hcalc', gold:'hdr r0 r1 r2'}],
    ['文件系统四层-一次读', {blue:'g app fdt ubuf', orange:'L1 oft fcb L2 calc bmap', green:'L3 bufA bufB', gold:'L4 drv ctl blk520 blk521 blk522 blk523 blk524 blk525 blk606 blk607'}],
    ['信号量-阻塞唤醒', {blue:'cpu procA', orange:'procB procC', green:'memory shared', gold:'kernel semaphore', violet:'code'}],
    ['真实软件里的进程与线程', {blue:'b3001 n4000 pg5000 my6000 jbd2 ksoft kswapd kworker', orange:'r3010 r3011 r3012 w0 w1 w2 w3 pg5001 pg5002 pg5003', green:'sh-data pgshm th-main th-comp th-r1 th-r2 th-io myt1 myt2 myt3 mybuf', gold:'b3002 b3003 nclients'}],
    ['GPU-FlashAttention', {blue:'q k0 k1 k2 k3 v0 v1 v2 v3', orange:'S P rs', green:'kt vt rm rl ra', gold:'o ro', violet:'cnt'}],
    ['GPU-分块矩阵乘', {blue:'A00 A01 A02 A03 A10 A11 A12 A13 A20 A21 A22 A23 A30 A31 A32 A33 S00 S01 S10 S11', orange:'B00 B01 B02 B03 B10 B11 B12 B13 B20 B21 B22 B23 B30 B31 B32 B33 U00 U01 U10 U11', green:'T00 T01 T10 T11 bar', gold:'cnt'}],
    ['GPU-一次ReLU', {blue:'py drv', orange:'fe sms blk w0 w1 w2 w3 w4 r0 r1 r2 r3 r4 alu', green:'l2 hbm lsu', gold:'mask'}],
    ['单周期RV32I-书图结构', {blue:'PC RF', orange:'CTL', green:'IM DM', gold:'INS IMM FIELDS'}],
    ['单周期数据通路-七条指令-书图结构加细', {blue:'PC RF', orange:'CTL SIG EXT NA', green:'IM DM', gold:'fOP fRs fRt fRd fIm branch-shift jump-concat'}],
    ['单周期数据通路-七条指令-交互演示', {blue:'PC RF', orange:'CTL SIG EXT NA ALU M2', green:'IM DM', gold:'fOP fRs fRt fRd fIm'}],
    ['单总线CPU-逐拍执行-书图结构加细', {blue:'PC IR MAR MDR Y Z FR GPR R0 R1 R2 R3 EPC IE', orange:'CU CLOCK DECODER CONTROL ICL', green:'m0 m1 m2 m3 m4 m5 m6 m7', gold:'dev'}],
    ['单总线CPU-逐拍执行-交互演示', {blue:'PC IR MAR MDR Y Z FR GPR R0 R1 R2 R3 EPC IE bus', orange:'CU ICL ALU', green:'m0 m1 m2 m3 m4 m5 m6 m7', gold:'dev'}],
    ['机械硬盘读盘', {blue:'cpu run act mem m-code m-buf m-byte', orange:'ctrl-host reg-cmd reg-lba reg-n reg-dma reg-data reg-status ctrl-drive calc map cache', gold:'drive-mech arm-park arm-seek arm-on', green:'note-addr'}],
    ['乱序执行-逐周期', {blue:'f0 f1 f2 f3 q0 q2', orange:'div mul alu', green:'rt free pP2 pP3 pP5 pP6 pP7 pP9 pP20 pP21 pP22 pP23', gold:'cyc r0 r2 r3', violet:'aR1 aR4 aR8'}],
    ['微程序控制器-执行一条ADD', {blue:'IR UPC UIR', orange:'MAP INT cm0 cm1 cm2 cm10 cm11 cm12 cm20 cm21 cm22 cm30 cm31', green:'MEM', gold:'DP SUM'}],
    ['硬件多线程与多核', {blue:'ctxA ctxB ctxC core1 core2 C00 C01 C02 C03', orange:'SEL EXE core1-CPU状态 core1-中断逻辑 core1-执行单元 core2-CPU状态 core2-中断逻辑 core2-执行单元', green:'L1 c1 c2 MEM mem2', gold:'bus'}],
    ['指令流水线-逐周期', {blue:'PC RF SWB', teal:'SIF T00', violet:'SID', green:'SEX DM', orange:'SMEM', gold:'HAZ FWD'}]
  ];
  const explicit = curated.find(([name]) => fileName.startsWith(name));
  if (explicit) {
    document.body.style.backgroundColor='#f7f6f2';
    const swatches = {
      blue:['#fbfdff','#5b90da','#dceaff'],
      teal:['#f9fefe','#439b9e','#c8eded'],
      orange:['#fffdf9','#df8731','#ffe5c7'],
      green:['#fbfefb','#50a56a','#daf0df'],
      gold:['#fffef9','#c89b28','#fff0bf'],
      violet:['#fdfcff','#8e77c8','#ebe4fb']
    };
    if (fileName.startsWith('单周期RV32I-书图结构')) {
      Object.assign(swatches, {
        blue:['#f7fbff','#4681bd','#97c6f4'],
        orange:['#fff9f5','#bf7652','#ffc19d'],
        green:['#f5fcf8','#4a9879','#9cddbb'],
        gold:['#fffbf2','#bd8b40','#f4ca78']
      });
    }
    const chosen = new Map();
    for (const [role, ids] of Object.entries(explicit[1]))
      for (const id of ids.split(' ')) chosen.set(id,role);
    const style = document.createElement('style');
    style.id='curated-figure-palette';
    style.textContent = `
      #ie-demo, main {--bg:#fff;--accent:#4b617c;--accent-soft:#e9edf3;--hot:#d94840;--hot-soft:#ffe4df;--panel:#fff;--fill:#f5f7f9;--border:#d8dfe7;--frame:#b9c4d0;--line:#bac4cf}
      #ie-demo{background:#fff}
      #ie-demo svg rect:is(.box,.cell):not([data-curated]){fill:#fff;stroke:#c8d0d9}
      #ie-demo svg rect:is(.box,.cell)[data-curated]{fill:var(--figure-idle);stroke:var(--figure-line);stroke-width:1.4}
      #ie-demo svg rect:is(.box,.cell)[data-curated].on,
      #ie-demo svg rect:is(.box,.cell)[data-curated].hot{fill:var(--figure-active);stroke:var(--figure-line);stroke-width:2.6}
      main svg g[data-curated]>rect:is(.panel,.cell){fill:var(--figure-idle);stroke:var(--figure-line);stroke-width:1.5}
      main svg g[data-curated].on>rect:is(.panel,.cell){fill:var(--figure-active);stroke:var(--figure-line);stroke-width:2.8}
      main svg .wire.on,#ie-demo svg .wire.on{stroke:#d94840;stroke-width:3}
      main .viewport,#ie-demo svg{background:#fff;border-color:#d8dfe7}
      main .panel,main .cell{fill:#fff;stroke:#c8d0d9}
      main svg #ftl.on>rect.panel{fill:#fff5e8}
      main svg #disk.on>rect.panel{fill:#fffaf0}
      main svg #hbm.on>rect.panel{fill:#edf8ef}
      main button.active,#ie-demo .tab.cur{background:#4b617c;border-color:#4b617c;color:#fff}
      main .detail,#ie-demo .step{background:#fff;border-left-color:#d94840}`;
    document.body.append(style);
    let pending=false;
    const paint=()=>{
      pending=false;
      for(const [id,role] of chosen){
        const node=document.getElementById(id);
        if(!node || !root.contains(node)) continue;
        const target=classic ? node : node.tagName.toLowerCase()==='g' ? node : node.closest('g[id]');
        if(!target) continue;
        const [idle,line,active]=swatches[role];
        target.dataset.curated=role;
        target.style.setProperty('--figure-idle',idle);
        target.style.setProperty('--figure-line',line);
        target.style.setProperty('--figure-active',active);
      }
    };
    new MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(paint)}})
      .observe(root,{subtree:true,childList:true});
    paint();
    return;
  }
  const profiles = [
    ['操作系统引导-交互演示', '#746047', '#f2e8d8', [
      ['cpu',/^CPU$|主板/], ['register',/模式位|PC 指向|CMOS|寄存器|0xCF8|0xCFC/],
      ['code',/ROM|BIOS 程序|复位地址|引导代码|启动管理器|Bootmgr/],
      ['memory',/内存|DRAM|中断向量表|页表|缓冲/],
      ['kernel',/内核|IDT|进程管理|设备管理/],
      ['disk',/硬盘|扇区|分区|MBR|PBR|NTFS/],
      ['controller',/芯片组|PCI|磁盘控制器/],
      ['device',/外设|显示器|喇叭|键盘/], ['process',/用户空间|init/]]],
    ['CLOCK-页面置换', '#596f75', '#e5eef0', [
      ['memory',/页框|内存|驻留/], ['disk',/磁盘|后备/], ['directory',/页表|引用位|指针/]]],
    ['IO控制方式-读一个扇区', '#86613d', '#f1e8dc', [
      ['cpu',/^CPU$/], ['memory',/^内存$/], ['controller',/控制器|通道/], ['register',/寄存器/], ['disk',/^磁盘$/]]],
    ['IO软件层次-一次write', '#657482', '#e8eef2', [
      ['process',/用户层|进程|用户空间/], ['kernel',/系统调用|设备独立|中断处理|内核/], ['controller',/驱动|控制器/], ['device',/打印机|硬件/], ['memory',/缓冲/]]],
    ['RAID-数据分布与恢复', '#82624f', '#f2e9e1', [
      ['disk',/磁盘|数据盘|盘 [0-9]|盘[0-9]/], ['data',/原始文件块|原文件顺序|数据|条带/], ['directory',/校验|奇偶|恢复/]]],
    ['SSD-映射与回收', '#617970', '#e6efea', [
      ['cpu',/主机：/], ['controller',/SSD 控制器|FTL/], ['directory',/映射|逻辑页|页表/], ['disk',/闪存|物理页|擦除块|SSD/], ['data',/有效|新数据/]]],
    ['VFS-路径挂载与读取', '#627994', '#e8eff5', [
      ['memory',/主机 RAM|页缓存|缓冲/], ['directory',/路径|目录|挂载|dentry/], ['inode',/inode|文件对象/], ['disk',/本机盘|U盘|磁盘|文件系统/]]],
    ['信号量-阻塞唤醒与共享更新', '#75644f', '#f0e9de', [
      ['cpu',/^CPU/], ['code',/用户程序|伪代码/], ['memory',/主机 RAM|共享物理页|缓冲/], ['kernel',/内核|信号量|队列|临界区/], ['process',/进程|线程|等待/]]],
    ['处理机调度-一张图走完', '#706b82', '#eeebf2', [
      ['cpu',/CPU|执行/], ['process',/进程|队列|就绪|等待/], ['kernel',/内核|调度器/], ['disk',/磁盘|后备|挂起/], ['device',/设备|I\/O/], ['time',/甘特图|时间片|指标/]]],
    ['文件分配方式-找第i块', '#61788a', '#e9eff3', [
      ['disk',/磁盘|块 \d+|物理块/], ['directory',/目录项|FAT|索引块|主索引|块表/], ['inode',/inode|地址项/], ['data',/数据块|读出的/]]],
    ['文件操作与共享-每一步', '#926a51', '#f4e9e0', [
      ['directory',/目录|位示图|超级块/], ['inode',/inode|FCB/], ['process',/进程|打开文件表/], ['disk',/磁盘|块 \d+/], ['kernel',/系统打开/]]],
    ['文件系统四层-一次读', '#687b70', '#eaf0e9', [
      ['process',/进程|用户态/], ['kernel',/逻辑文件系统|文件组织|基本文件系统|I\/O 控制|内核/], ['inode',/inode|FCB/], ['memory',/缓冲区/], ['controller',/驱动|控制器/], ['disk',/磁盘|物理块/]]],
    ['文件访问-跨章节', '#657a8b', '#e9f0f4', [
      ['cpu',/^CPU$/], ['directory',/目录|路径|打开文件表/], ['inode',/inode|文件元数据|FCB/], ['memory',/缓存|内存|缓冲|用户页|文件映射页/], ['controller',/控制器/], ['disk',/磁盘|数据块|块 10/]]],
    ['文件逻辑结构-找一个学生', '#8b6a43', '#f3e9da', [
      ['stream',/流式文件|字节|读写指针/], ['record',/记录式文件|记录|主文件|数据项/],
      ['directory',/索引表|散列|位置 \d+|组一项/], ['controller',/计算|查找/]]],
    ['目录与inode-按路径', '#9a7056', '#f5eae1', [
      ['directory',/目录|哈希|路径|线性列表/], ['inode',/inode|FCB/], ['disk',/磁盘|数据区|块 \d+/], ['process',/进程|当前目录/]]],
    ['真实软件里的进程与线程', '#5c7484', '#e8eff3', [
      ['cpu',/浏览器主进程|Nginx 主进程|主进程/], ['controller',/GPU 进程|合成线程|MySQL/],
      ['directory',/网络进程|IO 线程/], ['database',/PostgreSQL/],
      ['process',/渲染进程|工作进程|线程|Chrome|进程/],
      ['memory',/共享内存|缓存|地址空间/], ['kernel',/内核/], ['device',/屏幕|磁盘/]]],
    ['空闲块-分配与回收', '#637a6e', '#e9f1ea', [
      ['memory',/内核 RAM/], ['disk',/磁盘|盘块|空闲块/], ['directory',/位图|空闲表|链表|索引/], ['data',/本次文件|分配|回收|已用/]]],
    ['经典同步问题-信号量', '#8c7055', '#f3eade', [
      ['process',/生产者|消费者|读者|写者|爸爸|妈妈|儿子|女儿|进程|队列/], ['memory',/缓冲区|共享数据|共享文件|盘子/], ['kernel',/信号量|管程|mutex|empty|full|plate|apple|orange|条件变量/]]],
    ['设备独立软件-缓冲分配', '#617482', '#e7edf1', [
      ['process',/进程|用户/], ['memory',/缓冲/], ['disk',/输出井|输入井|磁盘/], ['controller',/驱动|控制器/], ['device',/打印机|设备/]]],
    ['请求分页-缺页处理', '#687c77', '#e7efed', [
      ['cpu',/CPU/], ['directory',/页表|页号|页表项/], ['memory',/内存|页框/], ['disk',/磁盘|外存/]]],
    ['调度程序内部-分派', '#89694d', '#f3eade', [
      ['register',/寄存器|\bPC\b|ESP|EAX|CR3/], ['kernel',/内核|调度程序|分派器|切换器/], ['process',/进程|线程|队列|PCB|用户/], ['cpu',/^CPU$/], ['disk',/磁盘/]]],
    ['进程与线程-一张图走完', '#647b83', '#e7eff0', [
      ['cpu',/^CPU$/], ['register',/寄存器|\bPC\b|EAX|ESP|CR3/], ['kernel',/内核|PCB|TCB|调度器|信号量/], ['process',/进程|线程|队列|用户/], ['memory',/内存|页表|地址空间|共享存储/], ['disk',/磁盘|扇区/]]],
    ['页框分配-抖动-工作集', '#7a6f56', '#f1ecdf', [
      ['process',/进程/], ['memory',/内存|页框|工作集/], ['disk',/磁盘|换入|换出/]]],
    ['页面置换算法-逐次访问', '#5f7b82', '#e6eff0', [
      ['memory',/物理块|页框/], ['directory',/访问页面|缺页|累计/], ['disk',/换出|被换/]]],
    ['GPU-FlashAttention', '#556b84', '#e8eef5', [
      ['vram',/HBM|中间矩阵/], ['shared',/共享内存|当前这块/],
      ['state',/寄存器|m：|l：|acc：/], ['intermediate',/概率|分数/], ['output',/输出/]]],
    ['GPU-一次ReLU', '#776856', '#f0eadf', [
      ['cpu',/主机|CPU/], ['controller',/驱动|GigaThread|读写单元/], ['process',/线程|W[0-9]|SM [0-9]/], ['memory',/L1|L2/], ['vram',/HBM/], ['register',/活动掩码/]]],
    ['GPU-分块矩阵乘', '#6b7187', '#eceef4', [
      ['vram',/HBM|全局内存/], ['shared',/共享内存|同步点/], ['state',/寄存器|线程 \(/], ['output',/对照|结果/]]],
    ['乱序执行-逐周期', '#86613d', '#f1e8dc', [
      ['code',/取指|译码|指令|时空图/], ['register',/寄存器|重命名表|ROB|发射队列/], ['cpu',/运算部件|除法器|乘法器|ALU/]]],
    ['单周期RV32I-书图结构', '#86613d', '#f1e8dc', [
      ['code',/指令|立即数|opcode|funct/], ['controller',/控制/], ['register',/寄存器|\bPC\b/], ['memory',/存储器/]]],
    ['单周期数据通路-七条指令-书图结构加细', '#86613d', '#f1e8dc', [
      ['controller',/控制器|控制信号/], ['code',/指令|OP |Rs |Rt |Rd |imm|扩展器/], ['register',/\bPC\b|寄存器/], ['cpu',/ALU|下地址逻辑/], ['memory',/存储器/]]],
    ['单周期数据通路-七条指令-交互演示', '#86613d', '#f1e8dc', [
      ['controller',/控制器|控制信号/], ['code',/指令|OP |Rs |Rt |Rd |imm|扩展器/], ['register',/\bPC\b|寄存器/], ['cpu',/ALU|下地址逻辑/], ['memory',/存储器/]]],
    ['单总线CPU-逐拍执行-书图结构加细', '#86613d', '#f1e8dc', [
      ['memory',/主存/], ['register',/MAR|MDR|\bPC\b|\bIR\b|寄存器|EPC|\bFR\b|^Y$|^Z$/], ['controller',/控制器|译码器|中断控制/], ['cpu',/ALU|总线|通用寄存器组/], ['device',/键盘/]]],
    ['单总线CPU-逐拍执行-交互演示', '#86613d', '#f1e8dc', [
      ['memory',/主存/], ['register',/MAR|MDR|\bPC\b|\bIR\b|寄存器|EPC|\bFR\b|^Y$|^Z$/], ['controller',/控制器|中断控制/], ['cpu',/ALU|总线/], ['device',/键盘/]]],
    ['微程序控制器-执行一条ADD', '#86613d', '#f1e8dc', [
      ['memory',/主存|控制存储器/], ['register',/寄存器|μPC|μIR|CMAR|CMDR/], ['controller',/控制器|微地址|控制/], ['code',/机器指令|微程序|微指令/], ['cpu',/数据通路/]]],
    ['指令流水线-数据通路加细', '#86613d', '#f1e8dc', [
      ['register',/\bPC\b|寄存器|IF\/ID|ID\/EX|EX\/MEM|MEM\/WB/], ['memory',/存储器|内存/], ['controller',/译码|控制|冒险|Stall|分支/], ['code',/指令|立即数|周期/]]],
    ['指令流水线-逐周期', '#86613d', '#f1e8dc', [
      ['register',/\bPC\b|寄存器/], ['memory',/存储器/], ['controller',/冒险检测|多路选择/], ['code',/IF 取指|ID 译码|EX 执行|MEM 访存|WB 写回/]]],
    ['机械硬盘读盘', '#7c6756', '#f1eade', [
      ['cpu',/主机|CPU/], ['memory',/内存条|缓冲区/], ['register',/寄存器|LBA|扇区数|DMA 目标地址/], ['controller',/控制器|地址转换|重映射/], ['disk',/硬盘|盘片|磁头|驱动器/]]],
    ['硬件多线程与多核', '#86613d', '#f1e8dc', [
      ['cpu',/CPU|核|执行部件|发射槽/], ['register',/寄存器组/], ['memory',/主存|Cache/], ['process',/线程/], ['controller',/互连|取指/]]]
  ];
  const file = decodeURIComponent(location.pathname.split('/').pop());
  const profile = profiles.find(([name]) => file.startsWith(name));
  if (!profile) return;
  const theme = profile.slice(1,3);
  const roleOf = label => profile[3].find(([,pattern]) => pattern.test(label))?.[0] || 'neutral';
  const base = {
    '--bg':'#faf8f2', '--panel':'#f3f0e8', '--fill':'#ece9df',
    '--border':'#d8d8ce', '--frame':'#9baaa0', '--line':'#a6b4aa',
    '--accent':theme[0], '--accent-soft':theme[1]
  };
  if (classic) {
    for (const [key,value] of Object.entries(base)) root.style.setProperty(key,value);
    root.style.backgroundColor = '#f8f5ee';
  }

  const colors = {
    cpu:['#f4eadc','#bd9d77'], register:['#e9edf6','#95a6c0'],
    vram:['#eee8f4','#a99abb'], shared:['#e4f0e8','#8cac9a'],
    state:['#fff0da','#c9a266'], intermediate:['#e5edf9','#8aa7ca'],
    output:['#f7e6de','#c89478'], database:['#f7e9df','#c5a18d'],
    stream:['#f4ede2','#c6aa88'], record:['#e7eff5','#97aec1'],
    kernel:['#f4e7df','#c69b86'], process:['#e8eff7','#8da9c3'],
    memory:['#e8f1e8','#8faf96'], disk:['#e8edf3','#94a8bd'],
    directory:['#e8f0f7','#91acc3'], inode:['#f7e9df','#c5a18d'],
    data:['#e7f1e7','#92b29a'], device:['#f4ecdf','#bca57e'],
    controller:['#e7efed','#8faaa3'], time:['#f6eddf','#c0a17d'],
    code:['#f0efe3','#afb08a'], neutral:['#f2eee7','#b5aa9b']
  };
  const zoneColors = {
    cpu:'#faf2e7', register:'#f2f5fa', vram:'#f3f0f8',
    shared:'#f0f7f2', state:'#fdf5e9', intermediate:'#f0f5fb',
    output:'#fcf2ec', database:'#fcf2ea', stream:'#faf4eb', record:'#f0f5f9',
    kernel:'#fbf1eb', process:'#f0f4f8', memory:'#f1f7f0',
    disk:'#f1f5f9', directory:'#eff5f9', inode:'#fcf2ea',
    data:'#f1f8f0', device:'#faf4e9', controller:'#f0f6f4',
    time:'#fbf4e8', code:'#f7f5eb', neutral:'#f6f3ed'
  };
  const labelAfter = element => {
    let next=element.nextElementSibling;
    for (let i=0;next && i<3;i++,next=next.nextElementSibling)
      if (next.tagName.toLowerCase()==='text') return next.textContent.trim();
    return '';
  };

  if (!classic) {
    document.body.style.backgroundColor='#f5f2eb';
    const style=document.createElement('style');
    style.textContent=`main .viewport{background:#faf8f2;border-color:#d5d8cf}
      main .panel{fill:#f3f0e8;stroke:#a5b1a8}
      main .cell{fill:#fffdf8;stroke:#b6c2b8}
      main svg g[data-figure-role]:not(.on)>rect.panel{fill:var(--figure-role-fill);stroke:var(--figure-role-stroke)}
      main svg .on .panel,main svg .on .cell,main svg .on>rect{stroke:${theme[0]};stroke-width:2.2}
      main svg g[data-figure-role].on>rect.panel{fill:var(--figure-role-fill);stroke:var(--figure-role-stroke);stroke-width:2.6}
      main button,main select,main details,main .detail{background:#faf8f2;border-color:#d5d8cf}
      main button.active{background:${theme[0]};color:white;border-color:${theme[0]}}
      main .wire.on{stroke:${theme[0]}}
      main .detail{border-left-color:${theme[0]}}`;
    document.head.append(style);
    let pending=false;
    const paint=()=>{
      pending=false;
      for(const group of root.querySelectorAll('svg g[id]')){
        const panel=group.querySelector(':scope > rect.panel');
        const title=group.querySelector(':scope > text.title');
        if(!panel || !title) continue;
        const role=roleOf(title.textContent.trim());
        if(role==='neutral') continue;
        const [fill,stroke]=colors[role];
        group.dataset.figureRole=role;
        group.style.setProperty('--figure-role-fill',zoneColors[role]);
        group.style.setProperty('--figure-role-stroke',stroke);
      }
    };
    new MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(paint)}})
      .observe(root,{subtree:true,childList:true,characterData:true});
    paint();
    return;
  }

  const style=document.createElement('style');
  style.textContent=`#ie-demo svg .zone[data-figure-role]{fill:var(--figure-role-fill);stroke:var(--figure-role-stroke)}
  #ie-demo svg rect.box[data-figure-role]:not(.hot),
  #ie-demo svg rect.cell[data-figure-role]:not(.hot){fill:var(--figure-role-fill);stroke:var(--figure-role-stroke)}
  #ie-demo svg rect.box[data-figure-role].on,
  #ie-demo svg rect.cell[data-figure-role].on{stroke-width:2.6}`;
  document.head.append(style);

  let pending=false;
  const paint=()=>{
    pending=false;
    for (const element of root.querySelectorAll('svg rect.zone,svg rect.box,svg rect.cell')) {
      if (element.style.fill || element.getAttribute('fill')) continue;
      const label=labelAfter(element);
      const zone=element.classList.contains('zone');
      const width=Number(element.getAttribute('width')||0);
      const height=Number(element.getAttribute('height')||0);
      if (!zone && (width<100 || height<42 || !label)) continue;
      const role=roleOf(label);
      if (!zone && role==='neutral') continue;
      const [fill,stroke]=colors[role];
      element.dataset.figureRole=role;
      element.style.setProperty('--figure-role-fill',zone ? zoneColors[role] : fill);
      element.style.setProperty('--figure-role-stroke',stroke);
    }
  };
  const schedule=()=>{if(!pending){pending=true;queueMicrotask(paint)}};
  new MutationObserver(schedule).observe(root,{subtree:true,childList:true,characterData:true});
  paint();
})();
