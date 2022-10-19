This is a sample theme for Obsidian ([https://obsidian.md](https://obsidian.md/)).

## First Time publishing a theme?

### Quick start

<img width="244" alt="Pasted image 20220822135601" src="https://user-images.githubusercontent.com/693981/186000386-4f4da987-fcaf-4aa5-aed4-e34b5901255d.png">

First, choose **Use this template**. That will create a copy of this repository (repo) under your Github profile. Then, you will want to _clone_ your new repository to your computer.

Once you have the repo locally on your computer, there are a couple of placeholder fields you will need to fill in.

1. Inside the `manifest.json` file, change the "name" field to whatever you want the name of your theme to be. For example:

  ```json
  {
    "name": "Moonstone",
    "version": "0.0.0",
    "minAppVersion": "1.0.0"
  }
  ```

2. Also inside the manifest.json file, you can include your name under next to the "author" field.

After you have those fields configured, all that's left to do is add your styles! All of your CSS needs to be inside the file `theme.css` which is located at root of your repository.

## Adding your theme to the Theme Gallery

### Add a screenshot thumbnail

Inside the repository, include a screenshot thumbnail of your theme. You can name the file anything, for example `screenshot.png`. This image will be used for the small preview in the theme list.

Your screenshot file should be `16:9` aspect ratio.
The recommended size is 512x288.

### Submit your theme for review

To have your theme included in the Theme Gallery, you will need to submit a Pull Request to [`obsidianmd/obsidian-releases`](https://github.com/obsidianmd/obsidian-releases#community-theme).

## Releasing Versions _(Optional)_

If your theme is getting more and more complex, you might want to start thinking about how your theme will stay compatible with different versions of Obsidian. Introduced in v0.16 of Obsidian, themes support [Github Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository). This means that you can specify which versions of your theme are compatible with which versions of Obsidian.

### Steps for releasing the initial version of your theme (1.0.0)

1. From your theme's repository, click on "Releases".
   
<img width="235" alt="Pasted image 20220822145001" src="https://user-images.githubusercontent.com/693981/186000441-287a1a97-65f6-4b5f-ba66-810ceae91cd3.png">

2. On the Releases page, there should be a button to **Draft a new Release**. Press it.

<img width="202" alt="Pasted image 20220822145048" src="https://user-images.githubusercontent.com/693981/186000664-6c63ae14-f685-4d39-bfe6-324f95cd9669.png">

3. Fill out the Release information form.
	- **Choose a Tag**: Type in the name of the version number here. At the bottom of the dropdown should be a button to create a new tag with your latest theme changes. Choose this option.
		<img width="340" alt="Pasted image 20220822145648" src="https://user-images.githubusercontent.com/693981/186000848-bd1c2619-ea09-4e70-a886-40769cda6921.png">
	- **Release Title**: This can be the version number.
	- **Description** _Optional_: Anything that changed
	- **Files:** The most important part of this form is uploading the files. You can do this by dragging 'n dropping the `manifest.json` file and the `theme.css` file your for theme inside the file upload field.

<img width="946" alt="Pasted image 20220822145356" src="https://user-images.githubusercontent.com/693981/186000772-e689ecea-c3b7-4e9d-9204-7ad62c0123aa.png">

4. Click "Publish Release."
5. Make sure that `versions.json` is set up correctly. This file is a map.
  ```json
  {
    "1.0.0": "0.16.0"
  }
  ```
  
  This means that version 1.0.0 of your theme is compatible with version 0.16.0 of Obsidian. For the initial release of your theme, you shouldn't need to make any changes to this file.
 
### Steps for releasing new versions

Releasing a new version of your theme is the same as releasing the initial version.

1. From your theme's repository, click on "Releases."
2. On the Releases page, there should be a button to **Draft a new Release**. Press it.
3. Fill out the Release information form.
	- **Choose a Tag**: Type in the name of the version number here. At the bottom of the dropdown should be a button to create a new tag with your latest theme changes. Choose this option.
		<img width="333" alt="Pasted image 20220822145812" src="https://user-images.githubusercontent.com/693981/186000912-f494def9-0f67-4662-92bf-bd278082455f.png">
	- **Release Title**: This can be the version number.
	- **Description** _Optional_: Anything that changed
	- **Files:** The most important part of this form is uploading the files. You can do this by dragging 'n dropping the `manifest.json` file and the `theme.css` file your for theme inside the file upload field.

4. Click "Publish Release."
5. Update the `versions.json` file in your repository. For the initial release of your theme, you probably didn't need to make any changes to the `versions.json` file. When you release subsequent versions of your theme; however, it's best practice to include the new version as entry in the versions.json file. So this might look like:
  ```json
  {  
		"1.0.0": "0.16.0",
		"1.0.1": "0.16.0"
  }
  ```

  What's important to note here is: the new version is included as the "key" and the "value" is the minimum version of Obsidian that your theme compatible with. So if the new version of your theme is only compatible with an Insider version of Obsidian, it's important to set this value accordingly. This will prevent users on older versions of Obsidian from updating to the newer version of your theme.
