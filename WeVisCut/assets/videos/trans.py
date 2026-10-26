from pathlib import Path
import argparse
import cv2


def extract_10th_frame(video_path: Path) -> None:
    cap = cv2.VideoCapture(str(video_path))

    if not cap.isOpened():
        print(f"[失败] 无法打开视频：{video_path}")
        return

    # OpenCV 从第 0 帧开始计数，因此第 10 帧的索引是 9
    cap.set(cv2.CAP_PROP_POS_FRAMES, 9)
    success, frame = cap.read()
    cap.release()

    if not success:
        print(f"[跳过] 视频不足 10 帧或读取失败：{video_path}")
        return

    output_path = video_path.with_suffix(".jpg")

    # 使用 imencode，兼容包含中文的保存路径
    success, encoded_image = cv2.imencode(".jpg", frame)
    if not success:
        print(f"[失败] 图片编码失败：{output_path}")
        return

    encoded_image.tofile(str(output_path))
    print(f"[完成] {output_path}")


def main():
    parser = argparse.ArgumentParser(description="提取文件夹内 MP4 视频的第 10 帧")
    parser.add_argument("folder", help="视频文件夹路径")
    parser.add_argument(
        "-r", "--recursive",
        action="store_true",
        help="递归遍历所有子文件夹"
    )
    args = parser.parse_args()

    folder = Path(args.folder)

    if not folder.is_dir():
        print(f"文件夹不存在：{folder}")
        return

    files = folder.rglob("*") if args.recursive else folder.iterdir()
    videos = [
        path for path in files
        if path.is_file() and path.suffix.lower() == ".mp4"
    ]

    if not videos:
        print("没有找到 MP4 视频")
        return

    for video_path in videos:
        extract_10th_frame(video_path)

    print(f"处理结束，共发现 {len(videos)} 个 MP4 视频")


if __name__ == "__main__":
    main()