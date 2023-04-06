import ray
import torch
import time,os
import logging
import whisper 
import numpy as np
import pandas as pd
from youtubesearchpython import *
import yt_dlp


@ray.remote(resources={"num_gpus": 1})
class WhisperModel:
    def __init__(self):
        if torch.cuda.is_available():
            device = torch.device("cuda")
        else:
            device = torch.device("cpu")
        self.model = whisper.load_model("medium", device=device)

    def transcribe(self, audio):
        return self.model.transcribe(audio)

    # def __del__(self):
    #     self.model.cpu()
    #     del self.model


def get_channel_videos(channel_id):
    audio_transcription_dir = 'audio_transcription'
    if not os.path.exists(audio_transcription_dir):
        os.makedirs(audio_transcription_dir)    
        
    playlist = Playlist(playlist_from_channel_id(channel_id))

    # Episode data
    stor_metadata=pd.DataFrame()
    for i, v in enumerate(playlist.videos):
        try:
            ep_number = int(i + 1)
            stor_metadata.loc[v['title'],'number']=ep_number
            stor_metadata.loc[v['title'],'link']=v['link']
            stor_metadata.loc[v['title'],'title']=v['title']
            stor_metadata.loc[v['title'],'img']=v['thumbnails'][3]['url']
        except Exception as e:
            print("Failed on %s", v['title'])
            print(e)

    last_complete_video = 0
    video_csv = stor_metadata[stor_metadata.number > last_complete_video]
    video_csv.reset_index().to_csv(f"{audio_transcription_dir}/episodes.csv")
    return video_csv


def download_video(video_csv, ix):
    ep_number=int(video_csv.loc[ix,'number'])
    print("EPISODE: %s"%ep_number)
    
    img_url=video_csv.loc[ix,'img']
    ep_link=video_csv.loc[ix,'link']
    
    # Write img 
    # with open("../public/0%s.jpg"%str(ep_number), 'wb') as f:
    #     response = requests.get(img_url)
    #     f.write(response.content)

    audio_dir = 'audio'
    if not os.path.exists(audio_dir):
        os.makedirs(audio_dir)

    # Write audio
    ydl_opts = {
        'format': 'm4a/bestaudio/best',
        'outtmpl': f'{audio_dir}/{ep_number}.m4a',
        'noplaylist': True,
        'postprocessors': [{  
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'm4a',
    }]}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        error_code = ydl.download(ep_link)


@ray.remote
def transcribe_video(video_csv, model_actor, ix):
    # model = ray.get(model_actor)
    
    # downloading video
    download_video(video_csv, ix)
    
    # get data 
    ep_number=int(video_csv.loc[ix,'number'])
    print("EPISODE: %s"%ep_number)
    logging.info("EPISODE: %s", ep_number)

    # get audio 
    audio_file_path=f'audio/{str(ep_number)}.m4a'
    
    audio_transcription_dir = 'audio_transcription'
    if not os.path.exists(audio_transcription_dir):
        os.makedirs(audio_transcription_dir)    
    out_file_path=f'{audio_transcription_dir}/0{str(ep_number)}.txt'

    print(f"Processing file: {audio_file_path}")
    logging.info(f"Processing file: {audio_file_path}")
    start_time = time.time()

    # load Whisper model and transcribe audio file
    result = ray.get(model_actor.transcribe.remote(audio_file_path))
    
    transcription = []
    
    # write
    with open(out_file_path, "w") as f:
        for seg in result['segments']:
            ts = np.round(seg['start'],1)
            f.write(video_csv.loc[ix,'link'] + "&t=%ss"%ts + "\t" + str(ts) + "\t" + seg['text'] + "\n")
            transcription.append(video_csv.loc[ix,'link'] + "&t=%ss"%ts + "\t" + str(ts) + "\t" + seg['text'] + "\n")

    end_time = time.time()
    time_diff = end_time - start_time
    print(f"Time taken: {time_diff:.2f} seconds")
    logging.info(f"File processed: {audio_file_path}")
    logging.info(f"Time taken: {time_diff:.2f} seconds")

    return transcription


if __name__ == '__main__':
    
    ray.init('auto')

    # Set up logger
    logging.basicConfig(filename='whisper.log', filemode='w', level=logging.DEBUG)
    
    channel_id = "UC2D2CMWXMOVWx7giW1n3LIg"
    video_csv = get_channel_videos(channel_id)

    # Run whisper on each audio file
    ray_tasks = []
    
    model_actor = WhisperModel.remote()

    ray_video_csv = ray.put(video_csv)    
    for ix in video_csv.index[2:3]:
        result = transcribe_video.remote(ray_video_csv, model_actor, ix)
        ray_tasks.append(result)

    result = ray.get(ray_tasks)
    
    print(result)