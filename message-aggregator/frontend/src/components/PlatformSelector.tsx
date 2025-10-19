import React from 'react';

const platforms = [
  { name: 'LinkedIn', value: 'linkedin' },
  { name: 'Twitter (X)', value: 'twitter' },
  { name: 'WhatsApp', value: 'whatsapp' },
  { name: 'Discord', value: 'discord' },
  { name: 'Facebook', value: 'facebook' },
  { name: 'Telegram', value: 'telegram' },
];

const PlatformSelector = ({ selectedPlatforms, onPlatformChange }) => {
  const handleChange = (event) => {
    const value = event.target.value;
    if (selectedPlatforms.includes(value)) {
      onPlatformChange(selectedPlatforms.filter((platform) => platform !== value));
    } else {
      onPlatformChange([...selectedPlatforms, value]);
    }
  };

  return (
    <div>
      <h3>Select Platforms</h3>
      {platforms.map((platform) => (
        <div key={platform.value}>
          <label>
            <input
              type="checkbox"
              value={platform.value}
              checked={selectedPlatforms.includes(platform.value)}
              onChange={handleChange}
            />
            {platform.name}
          </label>
        </div>
      ))}
    </div>
  );
};

export default PlatformSelector;