const crypto = require("crypto");

const decryptAES = (encryptedData, iv, aesKey) => {
    const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        crypto.createHash("sha256").update(aesKey).digest(),
        Buffer.from(iv, "hex")
    );

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};

module.exports = {
    decryptAES
};
