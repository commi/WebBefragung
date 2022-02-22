import {AfterContentChecked, Component, NgZone, SecurityContext} from '@angular/core';
import {LocalStorageService} from "ngx-store";
import {noop} from "rxjs";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";

type Answer = {
	questionId: string,
	text: string,
	attachmentUrl?: string | null
};
// Header

// Feature-Policy: microphone 'self'


const questions = [
	{
		id: '1',
		type: 'text+audio',
		title: 'Frage 1'
	},
	{
		id: '2',
		type: 'likert',
		title: 'Frage 2'
	}
];

@Component({
	selector: 'app-root',
	template: `
		<div class="container-lg">
			<h1>
				Welcome to {{title}}!
			</h1>
		</div>

		<section class="container-lg">

			<ul class="list-group">
				<li *ngFor="let q of this.questions" class="list-group-item">
					<h5 class="fw-bold">{{q.title}}</h5>

					<div *ngIf="q.type ==='likert'">

						<div class="btn-group w-100  btn-group-lg" role="group" aria-label="Wie sehr würden Sie zustimmen?">
							<input type="radio" class="btn-check" [name]="q.id+'likert'" [id]="q.id+'likert-1'" [(ngModel)]="answerFor(q.id).text" value="1" autocomplete="off">
							<label type="button" class="btn btn-outline-primary likert-1" [for]="q.id+'likert-1'">trifft zu</label>
							<input type="radio" class="btn-check" [name]="q.id+'likert'" [id]="q.id+'likert-2'" [(ngModel)]="answerFor(q.id).text" value="2" autocomplete="off">
							<label type="button" class="btn btn-outline-primary likert-2" [for]="q.id+'likert-2'">trifft eher zu</label>
							<input type="radio" class="btn-check" [name]="q.id+'likert'" [id]="q.id+'likert-3'" [(ngModel)]="answerFor(q.id).text" value="3" autocomplete="off">
							<label type="button" class="btn btn-outline-primary likert-3" [for]="q.id+'likert-3'">teils-teils</label>
							<input type="radio" class="btn-check" [name]="q.id+'likert'" [id]="q.id+'likert-4'" [(ngModel)]="answerFor(q.id).text" value="4" autocomplete="off">
							<label type="button" class="btn btn-outline-primary likert-4" [for]="q.id+'likert-4'">trifft eher nicht zu</label>
							<input type="radio" class="btn-check" [name]="q.id+'likert'" [id]="q.id+'likert-5'" [(ngModel)]="answerFor(q.id).text" value="5" autocomplete="off">
							<label type="button" class="btn btn-outline-primary likert-5" [for]="q.id+'likert-5'">trifft nicht zu</label>
						</div>
					</div>

					<div *ngIf="q.type ==='text+audio'">
						<textarea
							class="form-control"
							placeholder="Hier können Sie Ihre Antwort als Text eingeben"
							[(ngModel)]="answerFor(q.id).text"
							[ngModelOptions]="{updateOn:'blur'}"
						></textarea>
					</div>

					<div class="mt-3 row" *ngIf="q.type === 'text+audio'">
						<div class="col-4 row" *ngIf="!answerFor(q.id).attachmentUrl">
							<div class="col-auto">
								<button
									*ngIf="viewstate.recordingSupported"
									type="button"
									class="btn btn-outline-danger"
									(click)="recordAnswer(q.id)"
									[disabled]="q.id==recorderState.recording"
									[class]="{'btn-danger':!(q.id==recorderState.recording), 'btn-outline-danger':q.id==recorderState.recording}">
									<span *ngIf="q.id==recorderState.recording" class="spinner-grow spinner-grow-sm text-danger" role="status"></span>
									<span *ngIf="q.id==recorderState.recording">Recording…</span>
									<span *ngIf="q.id!=recorderState.recording">Record</span>
								</button>
							</div>
							<div class="col-auto">
								<button
									*ngIf="viewstate.recordingSupported"
									type="button"
									class="btn"
									[class]="{'btn-outline-dark':!(q.id==recorderState.recording),'btn-dark':q.id==recorderState.recording}"
									(click)="stopRecording()"
									[disabled]="q.id!=recorderState.recording"
								>Speichern / Stop
								</button>
							</div>
						</div>

						<div class="col-auto row" *ngIf="answerFor(q.id).attachmentUrl">
							<div class="col-auto">
								<p>Für diese Frage wurde ein Sprachaufnahme gespeichert</p>
								<div class="d-flex">
									<audio [src]="getAudioUrl(q.id)" controls preload="auto"></audio>
									<button type="button"
									        class="btn btn-outline-danger"
									        *ngIf="answerFor(q.id).attachmentUrl"
									        (click)="deleteRecording(q.id)">
										<i class="bi bi-trash"></i>
									</button>
								</div>
							</div>
						</div>
					</div>
				</li>
			</ul>


			<pre>{{answers|json}}</pre>

			<button class="btn" (click)="resetAnswers()">Alle Antworten löschen</button>

		</section>
	`,
	styles: []
})
export class AppComponent implements AfterContentChecked {

	constructor(
		private ngZone: NgZone,
		private localStorage: LocalStorageService,
		private _sanitizer: DomSanitizer) {

		try {
			this.viewstate.recordingSupported = MediaRecorder?.isTypeSupported("audio/webm");
		} catch (e) {
		}

		// Load answers
		this.answers = this.localStorage.get('answers') ?? [];

		// populate answers
		this.questions.forEach(q => {
			if (undefined === this.answers.find(a => a.questionId == q.id)) {
				this.answers.push({questionId: q.id, text: ''});
			}
		});
	}

	readonly title = 'WebBefragung';

	readonly questions = questions;

	viewstate = {
		recordingSupported: false
	}

	recorderState: { chunks: Blob[]; recording: string } = {
		chunks: [],
		recording: '', // the question id that is recording at the moment
	}


	answers: Array<Answer> = [];

	ngAfterContentChecked() {
		console.log('next');
		//this.answers?.save()

		this.localStorage.set('answers', this.answers);
	}

	answerFor(id: string): Answer {
		if (!this.answers?.length)
			this.resetAnswers();

		let answer = this.answers.find(a => a.questionId == id);
		if (answer === undefined) {
			answer = {questionId: id, text: ''};
			if (id)
				this.answers.push(answer);
		}
		return answer;
	}

	resetAnswers() {
		this.answers = [];
	}

	async recordAnswer(id: string) {
		const mediaRecorder = await this.getMediaRecorder();
		if (mediaRecorder == undefined) return;

		if (mediaRecorder.state == 'recording') {
			// stop recording, delete data
			mediaRecorder.onstop = noop;
			this.recorderState.recording = '';
			this.recorderState.chunks = [];
			mediaRecorder.stop();
		}

		mediaRecorder.ondataavailable = (e) => {
			this.recorderState.chunks.push(e.data);
		}

		mediaRecorder.start();
		console.log(mediaRecorder.state);
		console.log("recorder started");
		this.recorderState.recording = id;
	}

	/**
	 * Cache for the audio data URIs... this is needed because if the same URL is sanitized again, it creates a new object
	 * @private
	 */
	private audioUrlCache: Map<string, SafeResourceUrl> = new Map<string, SafeResourceUrl>();

	getAudioUrl(id: string): SafeResourceUrl | undefined {
		const attachmentUrl = this.answerFor(id).attachmentUrl;
		if (this._sanitizer.sanitize(SecurityContext.RESOURCE_URL, this.audioUrlCache.get(id) ?? null) != attachmentUrl) {
			this.audioUrlCache.set(id, this._sanitizer.bypassSecurityTrustResourceUrl(attachmentUrl as string));
		}
		return this.audioUrlCache.get(id);
	}

	async stopRecording() {
		const mediaRecorder = await this.getMediaRecorder();
		if (mediaRecorder == undefined) return;

		if (this.recorderState.recording && mediaRecorder.state === 'recording') {
			mediaRecorder.onstop = () => {
				this.ngZone.run(async () => {
					const blob = new Blob(this.recorderState.chunks, {'type': mediaRecorder.mimeType});
					this.answerFor(this.recorderState.recording).attachmentUrl = await blobToDataURL(blob);

					//this.answerFor(this.recorderState.recording).attachmentUrl = URL.createObjectURL(blob);
					this.recorderState.recording = '';
					this.recorderState.chunks = [];
				});
			}
			mediaRecorder.stop();
		} else {
			mediaRecorder.onstop = noop;
			this.recorderState.recording = '';
			this.recorderState.chunks = [];
			mediaRecorder.stop();
		}
		console.log("recorder stopped");
	}

	private mediaRecoder?: MediaRecorder = undefined;

	private async getMediaRecorder() {
		if (this.mediaRecoder == undefined || !this.mediaRecoder.stream.active) {
			this.mediaRecoder = undefined;
			const stream = await navigator.mediaDevices.getUserMedia({audio: true});
			try {
				this.mediaRecoder = new MediaRecorder(stream, {
					audioBitsPerSecond: 32000,
					mimeType: 'audio/webm'
				});
			} catch (err1) {
				try {
					// Fallback
					this.mediaRecoder = new MediaRecorder(stream);
				} catch (err2) {
					console.error({err2});
				}
			}
		}
		return this.mediaRecoder;
	}

	deleteRecording(id: string) {
		if (confirm("Soll die Audio-Aufnahme für diese Frage gelöscht werden?"))
			this.answerFor(id).attachmentUrl = undefined;
	}
}

function blobToDataURL(blob: Blob): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = _e => resolve(reader.result as string);
		reader.onerror = _e => reject(reader.error);
		reader.onabort = _e => reject(new Error("Read aborted"));
		reader.readAsDataURL(blob);
	});
}