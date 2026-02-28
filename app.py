from flask import Flask, render_template, request, send_file
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A5, A6, B6
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from PIL import Image, ImageEnhance
import os
import io

app = Flask(__name__)

# 绝对路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMP_DIR = os.path.join(BASE_DIR, 'temp')
PDF_PATH = os.path.join(TEMP_DIR, 'handbook.pdf')

# 创建temp文件夹
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR, mode=0o777)

# 强制让格子变浅（避免盖住背景）
def get_light_rgb(hex_color):
    try:
        hex_color = hex_color.lstrip('#')
        if len(hex_color) == 3:
            hex_color = ''.join([c*2 for c in hex_color])
        # 把颜色调浅50%
        r = (int(hex_color[0:2], 16) + 255) / 2 / 255.0
        g = (int(hex_color[2:4], 16) + 255) / 2 / 255.0
        b = (int(hex_color[4:6], 16) + 255) / 2 / 255.0
        return (r, g, b)
    except:
        return (0.85, 0.85, 0.85)  # 极浅的灰色

# 新增：处理图片透明度的函数
def apply_opacity_to_image(img, opacity):
    """
    将图片与白色背景融合，实现透明度效果
    :param img: PIL Image对象
    :param opacity: 透明度（0-100，100为完全不透明）
    :return: 处理后的PIL Image对象
    """
    # 转换为RGBA（确保有透明通道）
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # 创建白色背景图
    bg = Image.new('RGBA', img.size, (255, 255, 255, 255))
    
    # 计算透明度（opacity是百分比，转换为0-1的alpha值）
    alpha = opacity / 100.0
    # 融合图片和背景
    img_with_opacity = Image.blend(bg, img, alpha)
    
    # 转回RGB（避免ReportLab处理RGBA时的问题）
    return img_with_opacity.convert('RGB')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate-pdf', methods=['POST'])
def generate_pdf():
    try:
        # 1. 获取所有参数
        size = request.form.get('size', 'A5')
        style = request.form.get('style', 'grid')
        color = request.form.get('color', '#999999')
        spacing = float(request.form.get('spacing', 0.5))
        margin = float(request.form.get('margin', 1.0))
        bg_position = request.form.get('bg_position', 'center')
        # 修正：将透明度转为浮点数，并做范围限制（0-100）
        bg_opacity = float(request.form.get('bg_opacity', '80'))
        bg_opacity = max(0, min(100, bg_opacity))  # 确保值在0-100之间
        bg_file = request.files.get('bg_image')

        # 2. 页面尺寸
        SIZE_MAP = {"A5": A5, "A6": A6, "B6": B6}
        page_size = SIZE_MAP.get(size, A5)
        w, h = page_size

        # 3. 删除旧PDF
        if os.path.exists(PDF_PATH):
            os.remove(PDF_PATH)

        # 4. 初始化Canvas
        c = canvas.Canvas(PDF_PATH, pagesize=page_size)

        # ========== 核心：先画背景图（带透明度） ==========
        if bg_file:
            try:
                # 读取图片
                img = Image.open(io.BytesIO(bg_file.read()))
                # 应用透明度处理
                img = apply_opacity_to_image(img, bg_opacity)
                img_reader = ImageReader(img)
                
                # 强制拉伸填满页面
                c.drawImage(img_reader, 0, 0, width=w, height=h)
                print(f"✅ 背景图已绘制到PDF（透明度：{bg_opacity}%）")
            except Exception as e:
                print(f"❌ 背景图绘制失败：{str(e)}")

        # ========== 后画格子（极浅+超细） ==========
        rgb = get_light_rgb(color)
        c.setStrokeColorRGB(*rgb)
        c.setFillColorRGB(*rgb)
        c.setLineWidth(0.1)  # 线条超细（0.1pt）

        sp = spacing * cm
        mg = margin * cm

        # 绘制格子/线条/点阵
        if style == 'grid':
            x = mg
            while x <= w - mg:
                c.line(x, mg, x, h - mg)
                x += sp
            y = mg
            while y <= h - mg:
                c.line(mg, y, w - mg, y)
                y += sp
        elif style == 'line':
            y = mg
            while y <= h - mg:
                c.line(mg, y, w - mg, y)
                y += sp
        elif style == 'dot':
            x = mg
            while x <= w - mg:
                y = mg
                while y <= h - mg:
                    c.circle(x, y, 0.2, fill=1)  # 圆点超小
                    y += sp
                x += sp

        # 保存PDF
        c.showPage()
        c.save()

        # 验证文件并返回
        if os.path.exists(PDF_PATH):
            return send_file(
                PDF_PATH,
                mimetype='application/pdf',
                as_attachment=True,
                download_name='handbook_with_bg.pdf'
            )
        else:
            return "PDF生成失败", 500  # 修正：失败应返回500状态码

    except Exception as e:
        print(f"❌ 整体错误：{str(e)}")
        return f"生成失败：{str(e)}", 500  # 修正：失败应返回500状态码

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)