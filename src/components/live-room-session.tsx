"use client";

import { useEffect, useRef, useState } from "react";
import { TinyBadge } from "@/components/portal-ui";

type LiveRoomSessionProps = {
  mode: "join" | "host";
  className: string;
  roomCode: string;
  teacherName: string;
  participants: string[];
};

type PanelKey = "tools" | "chat" | "participants" | "materials";

const REACTIONS = ["Clap", "Thumbs up", "Heart", "Wave"];
const MATERIALS = ["Notes", "Recordings", "Assignments", "Files"];

function ActionButton({
  active,
  label,
  onClick,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition",
        active
          ? "bg-brand text-white shadow-[0_10px_24px_rgba(15,118,110,0.22)]"
          : "border border-white/18 bg-white/8 text-white hover:bg-white/14",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function PillButton({
  active,
  label,
  onClick,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-brand text-white"
          : "bg-white/[0.78] text-foreground hover:bg-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export function LiveRoomSession({
  mode,
  className,
  roomCode,
  teacherName,
  participants,
}: LiveRoomSessionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<BlobPart[]>([]);

  const [joined, setJoined] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [allMuted, setAllMuted] = useState(false);
  const [waitingRoomOn, setWaitingRoomOn] = useState(true);
  const [breakoutRoomsOn, setBreakoutRoomsOn] = useState(false);
  const [recordingOn, setRecordingOn] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [selectedReaction, setSelectedReaction] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelKey>("tools");
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: teacherName,
      body: "Class room ready.",
    },
  ]);
  const [selectedParticipant, setSelectedParticipant] = useState(
    participants[0] ?? teacherName,
  );
  const [participantList, setParticipantList] = useState(participants);
  const [mutedParticipants, setMutedParticipants] = useState<string[]>([]);
  const [cameraOffParticipants, setCameraOffParticipants] = useState<string[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState("Notes");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current?.stop();
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
    };
  }, [recordingUrl]);

  function applyStreamAudioEnabled(enabled: boolean) {
    cameraStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setMicOn(enabled && Boolean(cameraStreamRef.current));
  }

  function applyStreamVideoEnabled(enabled: boolean) {
    cameraStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setCameraOn(enabled && Boolean(cameraStreamRef.current));
  }

  async function startMedia() {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = stream;
      setJoined(true);
      setCameraOn(true);
      setMicOn(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (mediaError) {
      setError(
        mediaError instanceof Error
          ? mediaError.message
          : "Camera and microphone access were blocked.",
      );
    }
  }

  function stopMedia() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    screenStreamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setJoined(false);
    setCameraOn(false);
    setMicOn(false);
    setSharing(false);
    setAllMuted(false);
    setRecordingOn(false);
    setBreakoutRoomsOn(false);
    setRecordingUrl(null);
  }

  function toggleMic() {
    if (!cameraStreamRef.current) {
      return;
    }

    const next = !micOn;
    applyStreamAudioEnabled(next);
    if (next) {
      setAllMuted(false);
    }
  }

  function toggleCamera() {
    if (!cameraStreamRef.current) {
      return;
    }

    const next = !cameraOn;
    applyStreamVideoEnabled(next);
  }

  function toggleMuteAll() {
    if (!cameraStreamRef.current) {
      return;
    }

    const next = !allMuted;
    setAllMuted(next);
    applyStreamAudioEnabled(!next);
  }

  function toggleScreenShare() {
    if (sharing) {
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;

      if (videoRef.current && cameraStreamRef.current) {
        videoRef.current.srcObject = cameraStreamRef.current;
      }

      setSharing(false);
      return;
    }

    navigator.mediaDevices
      .getDisplayMedia({
        video: true,
        audio: false,
      })
      .then((stream) => {
        screenStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setSharing(true);

        stream.getVideoTracks()[0]?.addEventListener("ended", () => {
          if (videoRef.current && cameraStreamRef.current) {
            videoRef.current.srcObject = cameraStreamRef.current;
          }
          screenStreamRef.current = null;
          setSharing(false);
        });
      })
      .catch((mediaError) => {
        setError(
          mediaError instanceof Error
            ? mediaError.message
            : "Screen sharing was blocked.",
        );
      });
  }

  function startRecording() {
    if (!cameraStreamRef.current || recordingOn) {
      return;
    }

    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
    }

    recordingChunksRef.current = [];

    try {
      const recorder = new MediaRecorder(cameraStreamRef.current, {
        mimeType: "video/webm;codecs=vp9,opus",
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType });
        const url = URL.createObjectURL(blob);
        setRecordingUrl(url);
        recordingChunksRef.current = [];
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingOn(true);
    } catch {
      setError("Recording is not supported in this browser.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recordingOn) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setRecordingOn(false);
    }
  }

  function toggleRecording() {
    if (recordingOn) {
      stopRecording();
      return;
    }

    startRecording();
  }

  function copyRoomCode() {
    void navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    });
  }

  function sendChatMessage() {
    const body = chatMessage.trim();

    if (!body) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: `${Date.now()}`,
        sender: "You",
        body,
      },
    ]);
    setChatMessage("");
  }

  function cycleReaction() {
    setSelectedReaction((current) => (current + 1) % REACTIONS.length);
  }

  function removeSelectedParticipant() {
    setParticipantList((current) =>
      current.filter((participant) => participant !== selectedParticipant),
    );
    setMutedParticipants((current) =>
      current.filter((participant) => participant !== selectedParticipant),
    );
    setCameraOffParticipants((current) =>
      current.filter((participant) => participant !== selectedParticipant),
    );
    setSelectedParticipant((current) =>
      current === selectedParticipant ? "" : current,
    );
  }

  function toggleSelectedParticipantMute() {
    setMutedParticipants((current) =>
      current.includes(selectedParticipant)
        ? current.filter((participant) => participant !== selectedParticipant)
        : [...current, selectedParticipant],
    );
  }

  function toggleSelectedParticipantCamera() {
    setCameraOffParticipants((current) =>
      current.includes(selectedParticipant)
        ? current.filter((participant) => participant !== selectedParticipant)
        : [...current, selectedParticipant],
    );
  }

  const tabs: { key: PanelKey; label: string }[] = [
    { key: "tools", label: "Tools" },
    { key: "chat", label: "Chat" },
    { key: "participants", label: "People" },
    { key: "materials", label: "Materials" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[28px] border border-white/12 bg-[#13263b] p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-white/55">
              {mode === "host" ? "Host stage" : "Student view"}
            </p>
            <p className="mt-2 text-xl font-semibold">{className}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <TinyBadge tone={joined ? "brand" : "accent"}>
              {joined ? "Live" : "Not joined"}
            </TinyBadge>
            <TinyBadge>{roomCode}</TinyBadge>
            {allMuted ? <TinyBadge tone="accent">Muted all</TinyBadge> : null}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-[24px] border border-white/12 bg-black/30">
          <div className="relative min-h-[420px]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />

            {!joined ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_50%),linear-gradient(180deg,_rgba(8,15,28,0.2),_rgba(8,15,28,0.9))] p-6 text-center text-white">
                <div className="max-w-lg">
                  <p className="text-2xl font-semibold">
                    Your camera and microphone preview will appear here.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/72">
                    Start the room to request camera and audio access, then continue
                    speaking from inside the app.
                  </p>
                </div>
              </div>
            ) : null}

            {sharing ? (
              <div className="absolute bottom-4 left-4 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-lg">
                Screen sharing on
              </div>
            ) : null}

            {handRaised ? (
              <div className="absolute bottom-4 right-4 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg">
                Hand raised
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          {!joined ? (
            <ActionButton
              label={mode === "host" ? "Start class" : "Join room"}
              onClick={startMedia}
            />
          ) : (
            <ActionButton label="Leave room" onClick={stopMedia} />
          )}
          <ActionButton
            label={micOn ? "Mute mic" : "Unmute mic"}
            onClick={toggleMic}
          />
          <ActionButton
            label={cameraOn ? "Turn camera off" : "Turn camera on"}
            onClick={toggleCamera}
          />
          <ActionButton
            label={sharing ? "Stop share" : "Share screen"}
            onClick={toggleScreenShare}
          />
          <ActionButton
            active={handRaised}
            label={handRaised ? "Lower hand" : "Raise hand"}
            onClick={() => setHandRaised((current) => !current)}
          />
          <ActionButton
            active={copied}
            label={copied ? "Room code copied" : "Copy room code"}
            onClick={copyRoomCode}
          />
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-[28px] border border-border bg-white/[0.84] p-5">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <PillButton
                key={tab.key}
                active={activePanel === tab.key}
                label={tab.label}
                onClick={() => setActivePanel(tab.key)}
              />
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {activePanel === "tools" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {mode === "host" ? (
                  <>
                    <ActionButton
                      active={allMuted}
                      label={allMuted ? "Mute all on" : "Mute all"}
                      onClick={toggleMuteAll}
                    />
                    <ActionButton
                      active={waitingRoomOn}
                      label={waitingRoomOn ? "Waiting room on" : "Waiting room"}
                      onClick={() => setWaitingRoomOn((current) => !current)}
                    />
                    <ActionButton
                      active={breakoutRoomsOn}
                      label={breakoutRoomsOn ? "Breakout rooms on" : "Breakouts"}
                      onClick={() => setBreakoutRoomsOn((current) => !current)}
                    />
                    <ActionButton
                      active={recordingOn}
                      label={recordingOn ? "Recording on" : "Record"}
                      onClick={toggleRecording}
                    />
                  </>
                ) : (
                  <>
                    <ActionButton
                      active={handRaised}
                      label={handRaised ? "Hand raised" : "Raise hand"}
                      onClick={() => setHandRaised((current) => !current)}
                    />
                    <ActionButton
                      label={`Reaction: ${REACTIONS[selectedReaction]}`}
                      onClick={cycleReaction}
                    />
                    <ActionButton
                      label="Open chat"
                      onClick={() => setActivePanel("chat")}
                    />
                    <ActionButton
                      active={sharing}
                      label={sharing ? "Sharing screen" : "Share screen"}
                      onClick={toggleScreenShare}
                    />
                  </>
                )}
              </div>
            ) : null}

            {activePanel === "chat" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <TinyBadge tone="brand">Chat live</TinyBadge>
                  <TinyBadge tone="accent">
                    {messages.length} messages
                  </TinyBadge>
                </div>

                <div className="max-h-64 space-y-2 overflow-auto rounded-[24px] border border-border bg-white/[0.72] p-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="rounded-[18px] border border-border bg-white p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          {message.sender}
                        </p>
                        <TinyBadge>{message.body.length}</TinyBadge>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-muted">{message.body}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <input
                    value={chatMessage}
                    onChange={(event) => setChatMessage(event.target.value)}
                    placeholder="Type a message"
                    className="min-w-0 flex-1 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                  />
                  <button
                    type="button"
                    onClick={sendChatMessage}
                    className="inline-flex items-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b5c56]"
                  >
                    Send
                  </button>
                </div>
              </div>
            ) : null}

            {activePanel === "participants" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <TinyBadge tone="brand">Room people</TinyBadge>
                  <TinyBadge tone="accent">{participantList.length}</TinyBadge>
                  {selectedParticipant ? <TinyBadge>{selectedParticipant}</TinyBadge> : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {participantList.map((participant) => (
                    <button
                      key={participant}
                      type="button"
                      onClick={() => setSelectedParticipant(participant)}
                      className={[
                        "rounded-full px-4 py-2 text-sm font-semibold transition",
                        selectedParticipant === participant
                          ? "bg-brand text-white"
                          : "border border-border bg-white/[0.78] text-foreground hover:border-brand hover:text-brand",
                      ].join(" ")}
                    >
                      {participant}
                      {mutedParticipants.includes(participant) ? " | Muted" : ""}
                      {cameraOffParticipants.includes(participant) ? " | Camera off" : ""}
                    </button>
                  ))}
                </div>

                {mode === "host" ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <ActionButton
                      label="Approve"
                      onClick={() => setWaitingRoomOn(false)}
                    />
                    <ActionButton
                      label={
                        mutedParticipants.includes(selectedParticipant)
                          ? "Unmute selected"
                          : "Mute selected"
                      }
                      onClick={toggleSelectedParticipantMute}
                    />
                    <ActionButton
                      label={
                        cameraOffParticipants.includes(selectedParticipant)
                          ? "Camera on selected"
                          : "Camera off selected"
                      }
                      onClick={toggleSelectedParticipantCamera}
                    />
                    <ActionButton
                      label="Remove selected"
                      onClick={removeSelectedParticipant}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {activePanel === "materials" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <TinyBadge tone="brand">Class feed</TinyBadge>
                  <TinyBadge tone="accent">{selectedMaterial}</TinyBadge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {MATERIALS.map((material) => (
                    <button
                      key={material}
                      type="button"
                      onClick={() => setSelectedMaterial(material)}
                      className={[
                        "rounded-[22px] px-4 py-4 text-left text-sm font-semibold transition",
                        selectedMaterial === material
                          ? "bg-brand text-white"
                          : "border border-border bg-white/[0.78] text-foreground hover:border-brand hover:text-brand",
                      ].join(" ")}
                    >
                      {material}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ActionButton
                    label="Open notes"
                    onClick={() => setSelectedMaterial("Notes")}
                  />
                  <ActionButton
                    label="Open recordings"
                    onClick={() => setSelectedMaterial("Recordings")}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ActionButton
                    active={recordingOn}
                    label={recordingOn ? "Stop recording" : "Record class"}
                    onClick={toggleRecording}
                  />
                  <ActionButton
                    active={Boolean(recordingUrl)}
                    label={recordingUrl ? "Download recording" : "No recording yet"}
                    onClick={() => {
                      if (!recordingUrl) {
                        return;
                      }

                      const link = document.createElement("a");
                      link.href = recordingUrl;
                      link.download = `${className.replaceAll(" ", "-").toLowerCase()}.webm`;
                      link.click();
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
