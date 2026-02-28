document.addEventListener('DOMContentLoaded', function() {
    // 基础DOM元素
    const sizeSelect = document.getElementById('size-select');
    const styleSelect = document.getElementById('style-select');
    const colorPicker = document.getElementById('color-picker');
    const colorPreview = document.getElementById('color-preview');
    const spacingRange = document.getElementById('spacing-range');
    const spacingValue = document.getElementById('spacing-value');
    const marginRange = document.getElementById('margin-range');
    const marginValue = document.getElementById('margin-value');
    const previewBtn = document.getElementById('preview-btn');
    const downloadBtn = document.getElementById('download-btn');
    const printBtn = document.getElementById('print-btn');
    const previewArea = document.getElementById('preview-area');

    // 背景图相关DOM
    const bgUpload = document.getElementById('bg-upload');
    const bgPreviewThumb = document.getElementById('bg-preview-thumb');
    const bgPosition = document.getElementById('bg-position');
    const bgOpacity = document.getElementById('bg-opacity');
    const bgOpacityValue = document.getElementById('bg-opacity-value');

    // 全局变量
    let bgImage = null;

    // 初始化预览提示
    previewArea.innerHTML = '<div class="text-muted">选择参数后点击「实时预览」查看效果</div>';

    // 同步滑块值
    spacingRange.oninput = () => spacingValue.textContent = spacingRange.value;
    marginRange.oninput = () => marginValue.textContent = marginRange.value;
    bgOpacity.oninput = () => bgOpacityValue.textContent = bgOpacity.value;

    // 同步颜色选择器
    colorPicker.oninput = () => colorPreview.style.backgroundColor = colorPicker.value;

    // 背景图上传处理
    bgUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) {
            bgImage = null;
            bgPreviewThumb.innerHTML = '<span class="text-muted small">未上传图片</span>';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (ev) {
            bgImage = new Image();
            bgImage.onload = function() {
                // 显示缩略图
                bgPreviewThumb.innerHTML = `<img src="${ev.target.result}" class="bg-preview-img" style="max-width: 200px; max-height: 150px; border-radius: 4px;">`;
            };
            bgImage.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });

    // 生成预览（含背景图）
    function renderPreview() {
        try {
            const size = sizeSelect.value;
            const style = styleSelect.value;
            const color = colorPicker.value;
            const spacing = parseFloat(spacingRange.value);
            const margin = parseFloat(marginRange.value);
            const bgPos = bgPosition.value;
            const bgOp = parseFloat(bgOpacity.value) / 100;

            // 预览尺寸
            let pw, ph;
            switch (size) {
                case 'A5': pw=400; ph=567; break;
                case 'A6': pw=283; ph=400; break;
                case 'B6': pw=333; ph=469; break;
                case 'A7': pw = 300; ph = 425; break; // 新增 A7 尺寸
                default: pw = 300; ph = 425; // 默认改为 A7
            }

            // 创建画布
            const canvas = document.createElement('canvas');
            canvas.width = pw;
            canvas.height = ph;
            canvas.style.width = '100%';
            canvas.style.height = 'auto';
            canvas.style.border = '1px solid #eee';
            canvas.style.borderRadius = '8px';
            const ctx = canvas.getContext('2d');

            // 白色背景
            ctx.fillStyle = '#fff';
            ctx.fillRect(0,0,pw,ph);

            // 绘制背景图
            if (bgImage) {
                ctx.save();
                ctx.globalAlpha = bgOp;
                
                const iw = bgImage.width;
                const ih = bgImage.height;

                if (bgPos === 'center') {
                    const scale = Math.min(pw/iw, ph/ih);
                    const dw = iw * scale;
                    const dh = ih * scale;
                    const x = (pw - dw)/2;
                    const y = (ph - dh)/2;
                    ctx.drawImage(bgImage, x, y, dw, dh);
                } else if (bgPos === 'stretch') {
                    ctx.drawImage(bgImage, 0, 0, pw, ph);
                } else if (bgPos === 'tile') {
                    const pattern = ctx.createPattern(bgImage, 'repeat');
                    ctx.fillStyle = pattern;
                    ctx.fillRect(0, 0, pw, ph);
                } else {
                    // 其他位置默认居中
                    const scale = Math.min(pw/iw, ph/ih);
                    const dw = iw * scale;
                    const dh = ih * scale;
                    const x = (pw - dw)/2;
                    const y = (ph - dh)/2;
                    ctx.drawImage(bgImage, x, y, dw, dh);
                }
                ctx.restore();
            }

            // 绘制内页样式
            const scale = pw / 14.8;
            const mrg = Math.max(margin * scale, 10);
            let spc = spacing * scale;
            if (spc < 4) spc = 4;

            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = 1;

            if (style === 'grid') {
                ctx.beginPath();
                for (let x=mrg;x<pw-mrg;x+=spc) { ctx.moveTo(x,mrg); ctx.lineTo(x,ph-mrg); }
                for (let y=mrg;y<ph-mrg;y+=spc) { ctx.moveTo(mrg,y); ctx.lineTo(pw-mrg,y); }
                ctx.stroke();
            }

            if (style === 'line') {
                ctx.beginPath();
                for (let y=mrg;y<ph-mrg;y+=spc) { ctx.moveTo(mrg,y); ctx.lineTo(pw-mrg,y); }
                ctx.stroke();
            }

            if (style === 'dot') {
                for (let x=mrg;x<pw-mrg;x+=spc) {
                    for (let y=mrg;y<ph-mrg;y+=spc) {
                        ctx.beginPath(); ctx.arc(x,y,1,0,Math.PI*2); ctx.fill();
                    }
                }
            }

            // ========== 新增样式 ==========
            if (style === 'dotted_line') {
                // 圆点虚线：用小圆点模拟虚线
                const segmentLength = spc * 0.6; // 虚线段长度
                const gapLength = spc * 0.4;     // 间隔长度

                for (let y = mrg; y < ph - mrg; y += spc) {
                    let x = mrg;
                    let isDrawing = true;
                    while (x < pw - mrg) {
                        if (isDrawing) {
                            const nextX = Math.min(x + segmentLength, pw - mrg);
                            // 绘制多个小圆点组成线段
                            for (let dotX = x; dotX < nextX; dotX += 2) {
                                ctx.beginPath();
                                ctx.arc(dotX, y, 1, 0, Math.PI * 2);
                                ctx.fill();
                            }
                        }
                        x += isDrawing ? segmentLength : gapLength;
                        isDrawing = !isDrawing;
                    }
                }
            }

            if (style === 'wavy_line') {
                // 波浪线：用正弦函数生成波浪
                const amplitude = spc * 0.3;   // 波峰高度
                const wavelength = spc * 2;    // 波长

                for (let y = mrg; y < ph - mrg; y += spc) {
                    ctx.beginPath();
                    for (let x = mrg; x < pw - mrg; x += 1) {
                        const waveY = y + amplitude * Math.sin((x - mrg) * (2 * Math.PI) / wavelength);
                        if (x === mrg) {
                            ctx.moveTo(x, waveY);
                        } else {
                            ctx.lineTo(x, waveY);
                        }
                    }
                    ctx.stroke();
                }
            }

            if (style === 'random_dots') {
                // 随机点阵：在页面上随机分布点
                const numDots = 200; // 点的数量
                for (let i = 0; i < numDots; i++) {
                    const x = mrg + Math.random() * (pw - 2 * mrg);
                    const y = mrg + Math.random() * (ph - 2 * mrg);
                    ctx.beginPath();
                    ctx.arc(x, y, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // 显示预览
            previewArea.innerHTML = '';
            const wrap = document.createElement('div');
            wrap.style.display = 'flex';
            wrap.style.justifyContent = 'center';
            wrap.appendChild(canvas);
            previewArea.appendChild(wrap);

        } catch (e) {
            previewArea.innerHTML = `<div class="text-danger">预览出错：${e.message}</div>`;
            console.error('预览错误：', e);
        }
    }

    // 下载PDF（含背景图参数）
    function downloadPDF() {
        const fd = new FormData();
        // 基础参数
        fd.append('size', sizeSelect.value);
        fd.append('style', styleSelect.value);
        fd.append('color', colorPicker.value);
        fd.append('spacing', spacingRange.value);
        fd.append('margin', marginRange.value);
        // 背景图参数
        fd.append('bg_position', bgPosition.value);
        fd.append('bg_opacity', bgOpacity.value);
        // 背景图文件
        if (bgUpload.files.length > 0) {
            fd.append('bg_image', bgUpload.files[0]);
        }

        fetch('/generate-pdf', { method: 'POST', body: fd })
            .then(res => {
                if (!res.ok) throw new Error('服务器返回错误');
                return res.blob();
            })
            .then(b => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(b);
                a.download = 'handbook.pdf';
                a.click();
                URL.revokeObjectURL(a.href);
            })
            .catch(err => {
                alert('下载失败：' + err.message);
                console.error('下载错误：', err);
            });
    }

    // 绑定事件
    previewBtn.onclick = renderPreview;
    downloadBtn.onclick = downloadPDF;
    printBtn.onclick = downloadPDF;
});
