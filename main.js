
const $ = (selector) => document.querySelector(selector);

const audio = $("#audioPlayer");
const songGrid = $("#songGrid");
const galleryGrid = $("#galleryGrid");
const editButton = $("#editButton");
const editNotice = $("#editNotice");

let editing = false;
let currentSong = -1;

const defaultSongs = [
    {
        title: "Bedrott",
        artist: "duskydemise",
        cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR77pu9VyD_8xWj8LMmpIxS5CpWwLGxSWrVnDvPm2u5qg&s=10",
        audio: "./music/bedrott.mp3"
    },
    {
    title: "20200229 2",
    artist: "Mac DeMarco",
    cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDBdCtydBpvOpGIs04nZ05iKLdH7VI731sDgjv59D66A&s=10",
    audio: "./music/20200229 2.mp3"
},

 {
    title: "Insomniac",
    artist: "Memo Boy, Chakra Efendi",
    cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8hSO9Oj4K0HiuRriYxVk3ElNggTVREwUbl4SjMevriw&s=10",
    audio: "./music/Insomniac.mp3"
},

{
    title: "mistake",
    artist: "lots of hands",
    cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSq4TyLBMavlBj9_5klDOv4HP2yAmzevIENX4obnnDsjA&s=10",
    audio: "./music/lots of hands - mistake (Official Audio).mp3"

}
];

function loadJSON(key, fallback) {
    try {
        const result = JSON.parse(localStorage.getItem(key));
        return result ?? fallback;
    } catch {
        return fallback;
    }
}

function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

let songs = loadJSON("darkSongs", defaultSongs);
let messages = loadJSON("darkMessages", []);
let savedEntries = loadJSON("darkEntries", []);

function validURL(value) {
    if (!value || !value.trim()) return false;

    value = value.trim();

    if (/^https?:\/\//i.test(value)) {
        try {
            const url = new URL(value);
            return url.protocol === "http:" || url.protocol === "https:";
        } catch {
            return false;
        }
    }

    return !value.startsWith("/") &&
           !value.includes("..") &&
           !value.includes("\\");
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";

    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);

    return String(minutes).padStart(2, "0") + ":" +
           String(remaining).padStart(2, "0");
}

function showNotice(message) {
    editNotice.textContent = message;
    editNotice.classList.add("visible");

    clearTimeout(showNotice.timer);

    showNotice.timer = setTimeout(() => {
        editNotice.classList.remove("visible");
    }, 3500);
}

function updateClock() {
    const clock = $("#clock");

    if (clock) {
        clock.textContent = new Date().toLocaleTimeString("en-GB", {
            hour12: false
        });
    }
}

updateClock();
setInterval(updateClock, 1000);

function saveEditableText() {
    const data = [...document.querySelectorAll("[data-editable]")].map(element => ({
        index: element.dataset.saveIndex,
        html: element.innerHTML
    }));

    save("darkText", data);
}

function restoreText() {
    const saved = loadJSON("darkText", []);

    saved.forEach(item => {
        if (item.index === undefined) return;

        const element = document.querySelector(
            `[data-save-index="${item.index}"]`
        );

        if (element) element.innerHTML = item.html;
    });
}

function assignTextIDs() {
    document.querySelectorAll("[data-editable]").forEach((element, index) => {
        element.dataset.saveIndex = String(index);
    });
}

assignTextIDs();
restoreText();

editButton.addEventListener("click", () => {
    editing = !editing;
    document.body.classList.toggle("editing", editing);

    document.querySelectorAll("[data-editable]").forEach(element => {
        element.contentEditable = editing ? "true" : "false";
    });

    editButton.textContent = editing
        ? "[ SAVE CHANGES ]"
        : "[ EDIT WEBSITE ]";

    showNotice(editing
        ? "EDIT MODE ENABLED. Click text or images to edit. Right-click tracks to customize."
        : "CHANGES SAVED IN THIS BROWSER.");

    if (!editing) {
        saveEditableText();
        saveGallery();
        saveEntries();
    }
});

document.addEventListener("input", event => {
    if (editing && event.target.matches("[data-editable]")) {
        saveEditableText();
    }
});

function saveImages() {
    const images = [...document.querySelectorAll(".editable-image")]
        .map(img => img.src);

    save("darkImages", images);
}

function restoreImages() {
    const images = loadJSON("darkImages", []);

    document.querySelectorAll(".editable-image").forEach((img, index) => {
        if (images[index]) img.src = images[index];
    });
}

document.addEventListener("click", event => {
    const image = event.target.closest(".editable-image");

    if (!editing || !image) return;

    const value = prompt("Paste a direct image or GIF URL:", image.src);

    if (!value) return;

    if (!validURL(value)) {
        showNotice("INVALID IMAGE URL.");
        return;
    }

    image.src = value.trim();
    saveImages();
    saveGallery();
});

restoreImages();

function renderSongs() {
    songGrid.replaceChildren();

    songs.forEach((song, index) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "song-card";
        card.classList.toggle("playing", index === currentSong);

        const cover = document.createElement("div");
        cover.className = "song-cover";

        const img = document.createElement("img");
        img.src = song.cover;
        img.alt = "Cover for " + song.title;
        img.loading = "lazy";

        const overlay = document.createElement("span");
        overlay.className = "play-overlay";
        overlay.textContent =
            index === currentSong && !audio.paused ? "Ⅱ" : "▶";

        cover.append(img, overlay);

        const title = document.createElement("span");
        title.className = "song-name";
        title.textContent = song.title;

        const artist = document.createElement("span");
        artist.className = "song-artist";
        artist.textContent = song.artist;

        card.append(cover, title, artist);

        card.addEventListener("click", () => {
            if (index === currentSong && !audio.paused) {
                audio.pause();
            } else if (index === currentSong && audio.src) {
                audio.play().catch(handlePlaybackError);
            } else {
                playSong(index);
            }
        });

        card.addEventListener("contextmenu", event => {
            if (!editing) return;

            event.preventDefault();
            customizeSong(index);
        });

        songGrid.appendChild(card);
    });

    $("#songCount").textContent =
        String(songs.length).padStart(2, "0") + " FILES";
}

function handlePlaybackError(error) {
    console.error("Audio playback error:", error);

    showNotice(
        "Playback failed. Check the MP3 filename, folder, and file format."
    );
}

function playSong(index) {
    const song = songs[index];

    if (!song) return;

    if (!song.audio) {
        currentSong = index;
        updatePlayerInfo();
        renderSongs();

        showNotice("NO AUDIO FILE SET. Enable edit mode and right-click the track.");
        return;
    }

    if (!validURL(song.audio)) {
        showNotice("INVALID AUDIO PATH.");
        return;
    }

    currentSong = index;

    audio.pause();
    audio.src = song.audio;
    audio.load();

    updatePlayerInfo();
    renderSongs();

    audio.play()
        .then(() => {
            updatePlayerInfo();
            renderSongs();
        })
        .catch(handlePlaybackError);
}

function updatePlayerInfo() {
    const song = songs[currentSong];

    $("#nowTitle").textContent = song ? song.title : "nothing selected";
    $("#nowArtist").textContent = song ? song.artist : "unknown artist";

    $("#trackNumber").textContent = song
        ? String(currentSong + 1).padStart(2, "0")
        : "--";

    $("#nowCover").src = song
        ? song.cover
        : "https://placehold.co/300x300/171717/777777?text=NO+TRACK";

    $("#playButton").textContent = audio.paused ? "▶" : "Ⅱ";
}

function customizeSong(index) {
    const song = songs[index];

    const title = prompt("Track title:", song.title);
    if (title === null) return;

    const artist = prompt("Artist:", song.artist);
    if (artist === null) return;

    const cover = prompt("Direct cover image URL:", song.cover);
    if (cover === null) return;

    const audioURL = prompt(
        "Audio path or direct audio URL:",
        song.audio
    );

    if (audioURL === null) return;

    if (cover.trim() && !validURL(cover.trim())) {
        showNotice("The cover URL is invalid.");
        return;
    }

    if (audioURL.trim() && !validURL(audioURL.trim())) {
        showNotice("The audio path is invalid.");
        return;
    }

    song.title = title.trim() || "untitled";
    song.artist = artist.trim() || "unknown";
    song.cover = cover.trim() || song.cover;
    song.audio = audioURL.trim();

    save("darkSongs", songs);
    renderSongs();

    if (index === currentSong) {
        updatePlayerInfo();
    }

    showNotice("TRACK UPDATED.");
}

$("#playButton").addEventListener("click", () => {
    if (currentSong < 0) {
        playSong(0);
        return;
    }

    if (!audio.src) {
        playSong(currentSong);
        return;
    }

    if (audio.paused) {
        audio.play().catch(handlePlaybackError);
    } else {
        audio.pause();
    }
});

$("#prevButton").addEventListener("click", () => {
    if (songs.length) {
        playSong((currentSong - 1 + songs.length) % songs.length);
    }
});

$("#nextButton").addEventListener("click", () => {
    if (songs.length) {
        playSong((currentSong + 1) % songs.length);
    }
});

audio.addEventListener("play", () => {
    $("#playButton").textContent = "Ⅱ";
    renderSongs();
});

audio.addEventListener("pause", () => {
    $("#playButton").textContent = "▶";
    renderSongs();
});

audio.addEventListener("ended", () => {
    if (currentSong >= 0 && songs.length > 1) {
        playSong((currentSong + 1) % songs.length);
    }
});

audio.addEventListener("loadedmetadata", () => {
    $("#duration").textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
    $("#currentTime").textContent = formatTime(audio.currentTime);
    $("#duration").textContent = formatTime(audio.duration);

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
        $("#progress").value =
            (audio.currentTime / audio.duration) * 100;
    } else {
        $("#progress").value = 0;
    }
});

audio.addEventListener("error", () => {
    if (audio.src) {
        console.error("Audio element error:", audio.error);
    }
});

$("#progress").addEventListener("input", event => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime =
            (Number(event.target.value) / 100) * audio.duration;
    }
});

$("#addSongButton").addEventListener("click", () => {
    if (!editing) {
        showNotice("TURN ON EDIT WEBSITE FIRST.");
        return;
    }

    songs.push({
        title: "new_track",
        artist: "unknown",
        cover: "https://placehold.co/400x400/171717/777777?text=NEW",
        audio: ""
    });

    save("darkSongs", songs);
    renderSongs();

    showNotice("NEW TRACK ADDED. Right-click it to edit.");
});

renderSongs();
updatePlayerInfo();

function saveGallery() {
    const gallery = [...galleryGrid.querySelectorAll(".fragment")].map(item => ({
        src: item.querySelector("img").src,
        caption: item.querySelector("[data-caption]").textContent
    }));

    save("darkGallery", gallery);
}

function createFragment(src, caption, index) {
    const article = document.createElement("article");
    article.className = "fragment";

    const img = document.createElement("img");
    img.className = "editable-image";
    img.src = src;
    img.alt = "Fragment " + index;
    img.loading = "lazy";

    const captionBox = document.createElement("div");
    captionBox.className = "fragment-caption";

    const number = document.createElement("span");
    number.textContent = "IMG_" + String(index).padStart(3, "0");

    const text = document.createElement("p");
    text.dataset.caption = "";
    text.dataset.editable = "";
    text.dataset.saveIndex = "gallery-" + index;
    text.contentEditable = editing ? "true" : "false";
    text.textContent = caption;

    captionBox.append(number, text);
    article.append(img, captionBox);
    galleryGrid.appendChild(article);
}

function restoreGallery() {
    const gallery = loadJSON("darkGallery", null);

    if (!gallery) return;

    galleryGrid.replaceChildren();

    gallery.forEach((item, index) => {
        createFragment(item.src, item.caption, index + 1);
    });
}

restoreGallery();

$("#addImageButton").addEventListener("click", () => {
    if (!editing) {
        showNotice("TURN ON EDIT WEBSITE FIRST.");
        return;
    }

    const src = prompt("Paste a direct image or GIF URL:");

    if (!src) return;

    if (!validURL(src)) {
        showNotice("THAT IMAGE URL IS INVALID.");
        return;
    }

    const caption = prompt("Caption:", "untitled fragment");

    if (caption === null) return;

    createFragment(
        src.trim(),
        caption,
        galleryGrid.children.length + 1
    );

    saveGallery();
    saveImages();

    showNotice("FRAGMENT ADDED.");
});

function createEntry(title, date, text) {
    const entry = document.createElement("article");
    entry.className = "diary-entry";

    const meta = document.createElement("div");
    meta.className = "entry-meta";

    const titleSpan = document.createElement("span");
    titleSpan.textContent = title;

    const dateSpan = document.createElement("span");
    dateSpan.textContent = date;

    meta.append(titleSpan, dateSpan);

    const paragraph = document.createElement("p");
    paragraph.dataset.editable = "";
    paragraph.textContent = text;
    paragraph.contentEditable = editing ? "true" : "false";

    paragraph.addEventListener("input", saveEntries);

    const end = document.createElement("span");
    end.className = "muted";
    end.textContent = "END TRANSMISSION.";

    entry.append(meta, paragraph, end);
    $("#addEntryButton").before(entry);
}

function renderEntries() {
    savedEntries.forEach(entry => {
        createEntry(entry.title, entry.date, entry.text);
    });
}

function saveEntries() {
    const entries = [
        ...document.querySelectorAll("#diary .diary-entry")
    ].map(entry => ({
        title: entry.querySelector(".entry-meta span").textContent,
        date: entry.querySelectorAll(".entry-meta span")[1].textContent,
        text: entry.querySelector("p").textContent
    }));

    savedEntries = entries;
    save("darkEntries", entries);
}

$("#addEntryButton").addEventListener("click", () => {
    if (!editing) {
        showNotice("TURN ON EDIT WEBSITE FIRST.");
        return;
    }

    const text = prompt("Write your new diary entry:");

    if (!text) return;

    const title = "ENTRY_" + String(
        document.querySelectorAll("#diary .diary-entry").length + 1
    ).padStart(3, "0");

    const date = new Date().toLocaleDateString();

    createEntry(title, date, text);
    saveEntries();

    showNotice("ENTRY ADDED.");
});

renderEntries();

function renderMessages() {
    const list = $("#messageList");
    list.replaceChildren();

    messages.slice(0, 20).forEach(message => {
        const note = document.createElement("div");
        note.className = "message-note";
        note.textContent = "> " + message;

        list.appendChild(note);
    });
}

$("#messageForm").addEventListener("submit", event => {
    event.preventDefault();

    const value = $("#messageInput").value.trim();

    if (!value) return;

    messages.unshift(value);
    messages = messages.slice(0, 20);

    save("darkMessages", messages);
    renderMessages();

    event.target.reset();
});

renderMessages();
